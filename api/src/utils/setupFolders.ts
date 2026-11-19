import path from 'path'

import { createFolder } from '@sasjs/utils'
import { APP_FOLDERS_ROOT } from '@sasjs/api'

import { getFilesFolder, getPackagesFolder } from './file'

export const setupFilesFolder = async () => await createFolder(getFilesFolder())

export const setupPackagesFolder = async () =>
  await createFolder(getPackagesFolder())

/**
 * Where a published app's frontend lives: one reserved folder at the root of the
 * drive, `apps`, with a folder per app inside it.
 *
 * The name is `@sasjs/api`'s - `APP_FOLDERS_ROOT`, and `frontendFolderOf(name)`
 * for an app - so it is imported here rather than spelled a second time: the App
 * Stream reads an app's files from this path, and a folder made under any other
 * name would be a place a deploy never writes to.
 */
export const getAppsFolder = () => path.join(getFilesFolder(), APP_FOLDERS_ROOT)

/**
 * Creates the drive-root `apps` folder when it is absent.
 *
 * Until an app was published the folder simply did not exist, so a fresh
 * installation opened Studio on a drive with no `apps` in the tree - nothing to
 * browse, and no folder to create a frontend in by hand. A frontend is a thing
 * people read and edit in Studio, not only a thing a deploy writes, so it is
 * seeded at startup the way the drive-root `.sasjslint` is: an install that
 * predates the folder gets it without a migration step, and one a user deletes
 * comes back on the next restart.
 *
 * It creates a folder and nothing else. The App Stream lists what the index holds,
 * not what is under `apps/`, so an empty folder advertises no app.
 */
export const setupAppsFolder = async () => await createFolder(getAppsFolder())
