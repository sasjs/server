import path from 'path'
import { deleteFolder, fileExists, folderExists } from '@sasjs/utils'
import { APP_FOLDERS_ROOT, frontendFolderOf } from '@sasjs/api'

import * as fileUtilModules from '../file'
import { getAppsFolder, setupAppsFolder } from '../setupFolders'

const tmpFolder = path.join(process.cwd(), `tmp-apps-folder-${process.pid}`)
const filesFolder = path.join(tmpFolder, 'files')

jest
  .spyOn(fileUtilModules, 'getFilesFolder')
  .mockImplementation(() => filesFolder)

describe('the drive-root apps folder', () => {
  beforeEach(async () => {
    await deleteFolder(tmpFolder)
  })

  afterAll(async () => {
    await deleteFolder(tmpFolder)
  })

  it('is the drive folder @sasjs/api serves a frontend from', () => {
    // the address is the package's, not one spelled here: an app's files are read
    // from `apps/<name>` under the drive root, so a folder made anywhere else is
    // one a deploy never writes to and the App Stream never reads
    expect(getAppsFolder()).toEqual(path.join(filesFolder, APP_FOLDERS_ROOT))
    expect(path.join(APP_FOLDERS_ROOT, 'myapp')).toEqual(
      frontendFolderOf('myapp').replace(/^\//, '')
    )
  })

  it('is created on a fresh install, parents and all', async () => {
    // nothing here has been set up yet: the seed creates what it needs rather than
    // failing on a drive that has no files folder either
    await setupAppsFolder()

    expect(await folderExists(getAppsFolder())).toBe(true)
  })

  it('leaves an app that is already there untouched', async () => {
    await setupAppsFolder()

    // an app's frontend, as a publish would have written it
    const page = path.join(getAppsFolder(), 'myapp', 'index.html')
    const { createFile } = await import('@sasjs/utils')
    await createFile(page, '<!doctype html><title>My App</title>')

    // a restart runs the seed again, and it must not clear or rewrite the folder:
    // the apps under `apps/` are what people published and edited
    await setupAppsFolder()

    expect(await fileExists(page)).toBe(true)
  })
})
