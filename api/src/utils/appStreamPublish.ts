import {
  ApiError,
  appSummary,
  checkPublishRequest,
  frontendFolderOf,
  publishRequestFor,
  splitAppBundle,
  type AppManifest,
  type AppStreamEntry,
  type CheckedPublish,
  type DeployTree
} from '@sasjs/api'

import {
  appStreamDrive,
  appStreamService,
  refreshAppStreamIndex
} from './appStreamConfig'
import { APP_NAME_MAX_LENGTH, APP_NAME_PATTERN } from './validation'

/** What a deploy route sends: the fields that decide whether it publishes. */
export interface DeployPublishFields {
  /** The app's name, when the request states one. */
  name?: string
  /** The backend folder. Metadata for a frontend publish, and optional. */
  appLoc?: string
  fileTree: unknown
  /** Legacy: the folder under `services/` holding the compiled web assets. */
  streamWebFolder?: string
  /** The app's name, under the field name an older payload uses. */
  streamServiceName?: string
  streamLogo?: string
}

/** A deploy, split into the writes it makes and the app it publishes. */
export interface PreparedDeploy {
  /** The tree the bundle's body describes. Written to `appLoc` unless `frontend` is set. */
  tree: DeployTree
  /** The compiled frontend of a package, written to `apps/<name>`. */
  frontend?: DeployTree
  /** The backend a package carries, written to `appLoc` additively. */
  backend?: DeployTree
  /** The app to index, when this deploy publishes one. */
  request?: CheckedPublish
}

/**
 * The refusal a tree earns when it names no folder to be deployed to.
 *
 * One string, because two routes answer it - the package's refusal envelope on the
 * deploy routes, and this server's `HttpError` from the controller - and a message
 * a client matches on cannot be written twice.
 */
export const DEPLOY_NEEDS_FOLDER =
  '"appLoc" is required to deploy files that do not name an app.'

/** What a published app is reported as, on the deploy answer. */
export interface PublishedApp {
  id: string
  name: string
  url: string
}

/**
 * A deploy, split into the trees to write and the app to index.
 *
 * The bundle says what it is. A package names its halves - `web/` and an optional
 * `backend/`, with `sasjs.app.json` at the root saying which app the frontend is -
 * and the manifest is not itself part of the deployment. The older shape is one
 * tree written to `appLoc`, with the web assets carried at
 * `services/<streamWebFolder>`. The request wins where both speak, because a caller
 * naming a folder or a name is correcting the archive rather than repeating it.
 *
 * Every reason to refuse is decided HERE, before the drive is touched: a request
 * the index would not accept must not leave its files behind. The drive and the
 * index are two writes and there is no transaction across them, so the order is
 * the transaction - check, deploy, index.
 */
export const prepareDeploy = (deploy: DeployPublishFields): PreparedDeploy => {
  const bundle = splitAppBundle(deploy.fileTree)
  const packaged = bundle.frontend !== undefined

  const requested = publishRequestFor(
    {
      name: deploy.name,
      appLoc: deploy.appLoc,
      streamWebFolder: deploy.streamWebFolder,
      streamServiceName: deploy.streamServiceName,
      streamLogo: deploy.streamLogo
    },
    bundle.manifest as AppManifest | undefined,
    { packaged }
  )

  if (!requested)
    return {
      tree: bundle.tree,
      ...(bundle.frontend === undefined ? {} : { frontend: bundle.frontend }),
      ...(bundle.backend === undefined ? {} : { backend: bundle.backend })
    }

  // every refusal is the package's: the name is validated as the folder and the
  // address it now is, the drive root and a multi-segment legacy folder are
  // refused, and the tree has to carry what a browser would open - the frontend of
  // a package, or the legacy folder the assets are in.
  const request = checkPublishRequest(
    requested,
    packaged ? bundle.frontend : bundle.tree,
    {
      folderFromManifest:
        deploy.streamWebFolder === undefined &&
        (bundle.manifest as AppManifest | undefined)?.streamWebFolder !==
          undefined
    }
  )

  return {
    tree: bundle.tree,
    ...(bundle.frontend === undefined ? {} : { frontend: bundle.frontend }),
    ...(bundle.backend === undefined ? {} : { backend: bundle.backend }),
    request
  }
}

/**
 * Indexes the app a deploy published, and states it on the answer.
 *
 * Runs after the deploy succeeded: the id is minted here the first time and kept
 * on every redeploy, which is what makes an app's URL survive a new bundle. The
 * inventory the permission gate reads is refreshed in the same breath, so a grant
 * on the new app's route works on the next request rather than after a restart.
 */
export const publishDeployedApp = async (
  answer: { app?: PublishedApp } & Record<string, unknown>,
  request?: CheckedPublish
): Promise<void> => {
  if (!request) return

  const entry = await appStreamService().publish(request)

  await refreshAppStreamIndex()

  answer.app = appSummary(entry)
}

/**
 * Whether a name can be the single folder segment `apps/<name>`.
 *
 * The rule a publish applies, asked again where a folder is DELETED: an index
 * that was restored, hand-edited or written by something other than this server is
 * read back without it being anybody's decision, and a name carrying a separator
 * or `..` would otherwise build a deletion path outside `apps/`.
 */
const isDeletableName = (name: string): boolean =>
  name.length <= APP_NAME_MAX_LENGTH && APP_NAME_PATTERN.test(name)

/**
 * Removes an app's frontend folder, once the index has forgotten it.
 *
 * An app published as a frontend IS its folder - `apps/<name>` - so unpublishing
 * removes it: an app that is no longer published should not leave a page on the
 * drive that nothing links to and nothing serves. A legacy entry is left alone,
 * because its files sit inside a backend folder that may serve other apps, and
 * deleting that would take their services with it.
 *
 * A folder that is already gone is not a failure. An index entry can outlive its
 * deployment - someone deleted the folder by hand - and the app is unpublished
 * either way, so the absence is logged rather than answered as an error.
 */
export const removeFrontendFolder = async (
  entry: AppStreamEntry
): Promise<void> => {
  if (entry.streamWebFolder !== undefined) return

  if (!isDeletableName(entry.name)) {
    process.logger?.warn?.(
      `The app "${entry.name}" was unpublished, but its name is not a folder this server publishes, so nothing was removed.`
    )

    return
  }

  const folder = frontendFolderOf(entry.name)

  try {
    await appStreamDrive().rmdir(folder)
  } catch (error) {
    process.logger?.warn?.(
      `The app "${entry.name}" was unpublished, but its frontend at ${folder} could not be removed: ${
        (error as Error)?.message ?? error
      }`
    )
  }
}

/**
 * Drops an unpublish from the inventory, and removes the folder it published.
 *
 * The two routes that unpublish an app differ in who forgets the entry - the
 * service for `DELETE /SASjsApi/app/:id`, the package's own handler for
 * `DELETE /app/:id` - and agree on what follows it. This is that agreement in one
 * place: the inventory is what the gate and the permission editor read, so the
 * entry leaves it now rather than at the next restart, and the drive loses the
 * folder the entry published. Two removals that disagreed about the files would
 * be one removal and one surprise.
 *
 * The entry is optional because the app route reports an unpublish that answered
 * anything other than 200 as well, and an app it could not name leaves nothing to
 * remove.
 */
export const forgetPublishedApp = async (
  entry?: AppStreamEntry
): Promise<void> => {
  await refreshAppStreamIndex()

  if (entry) await removeFrontendFolder(entry)
}

/**
 * Unpublishes an app by id and cleans up after it.
 *
 * The id is the handle: the service forgets the entry, and what is left on the
 * drive is decided by the shape the entry had.
 */
export const unpublishApp = async (id: string): Promise<AppStreamEntry> => {
  const removed = await appStreamService().unpublish(id)

  await forgetPublishedApp(removed)

  return removed
}
