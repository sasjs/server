import {
  appSummary,
  checkPublishRequest,
  publishRequestFor,
  splitAppBundle,
  type AppManifest,
  type CheckedPublish,
  type DeployTree
} from '@sasjs/api'

import { appStreamService, refreshAppStreamIndex } from './appStreamConfig'

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
