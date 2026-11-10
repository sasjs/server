import {
  ApiError,
  appSummary,
  checkPublishRequest,
  publishRequestFor,
  splitAppBundle,
  type AppManifest,
  type PublishAppRequest
} from '@sasjs/api'

import { appStreamService, refreshAppStreamIndex } from './appStreamConfig'

/** What a deploy route sends: the fields that decide whether it publishes. */
export interface DeployPublishFields {
  appLoc: string
  fileTree: unknown
  streamWebFolder?: string
  streamServiceName?: string
  streamLogo?: string
}

/** What a published app is reported as, on the deploy answer. */
export interface PublishedApp {
  id: string
  name: string
  url: string
}

/**
 * A deploy, split into the tree to write and the app to index.
 *
 * The bundle says what it is: `sasjs.app.json` at the archive root names the app
 * - its label, the folder holding its web assets, its logo, the origins allowed
 * to frame it - and is not itself part of the deployment. The request wins where
 * both speak, because a caller naming a folder or a label is correcting the
 * archive rather than repeating it.
 *
 * Every reason to refuse is decided HERE, before the drive is touched: a request
 * the index would not accept must not leave its files behind. The drive and the
 * index are two writes and there is no transaction across them, so the order is
 * the transaction - check, deploy, index.
 */
export const prepareDeploy = (
  deploy: DeployPublishFields
): { tree: unknown; request?: PublishAppRequest } => {
  const { tree, manifest } = splitAppBundle(deploy.fileTree)

  const request = publishRequestFor(
    {
      appLoc: deploy.appLoc,
      streamWebFolder: deploy.streamWebFolder,
      streamServiceName: deploy.streamServiceName,
      streamLogo: deploy.streamLogo
    },
    manifest as AppManifest | undefined
  )

  if (!request) return { tree }

  // normalises the folder, refuses the drive root, and refuses a web folder that
  // is not a single segment - the package's rules, before anything is written
  checkPublishRequest(request)

  if (!hasStreamFolder(tree, request.streamWebFolder))
    throw new ApiError(
      400,
      noStreamFolder(deploy.appLoc, request.streamWebFolder)
    )

  return { tree, request }
}

/**
 * Whether the tree carries the folder App Stream serves an app from.
 *
 * An app is served out of `<appLoc>/services/<streamWebFolder>`, so a tree
 * without that folder would be indexed and then answer 404 to every request -
 * a tile that opens nothing, which is worse than a refusal that says which
 * folder is missing.
 */
const hasStreamFolder = (tree: any, streamWebFolder: string): boolean => {
  const services = (tree?.members ?? []).find(
    (member: any) => member.type === 'folder' && member.name === 'services'
  )

  return Boolean(
    services?.members?.some(
      (member: any) =>
        member.type === 'folder' && member.name === streamWebFolder
    )
  )
}

/** The refusal a tree earns when it has nothing to publish. */
const noStreamFolder = (appLoc: string, streamWebFolder: string): string =>
  `The deployed tree has no "services/${streamWebFolder}" folder, so nothing would be published at ${appLoc}. Deploy the web assets under services/${streamWebFolder}, or omit streamWebFolder.`

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
  request?: PublishAppRequest
): Promise<void> => {
  if (!request) return

  const entry = await appStreamService().publish(request)

  await refreshAppStreamIndex()

  answer.app = appSummary(entry)
}
