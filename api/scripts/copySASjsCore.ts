import path from 'path'
import {
  asyncForEach,
  copy,
  createFile,
  createFolder,
  deleteFolder,
  listFilesInFolder
} from '@sasjs/utils'

import { apiRoot, sasJSCoreMacros } from '../src/utils/file'

const macroCorePath = path.join(apiRoot, 'node_modules', '@sasjs', 'core')

/**
 * Rebuilds `sasJSCoreMacros` from the `@sasjs/core` tree and writes its
 * inventory, which `downloadMacros` then extends with the downloaded macros.
 *
 * The legacy cache is removed first: v6.1.0 shipped the SAS_PACKAGES download
 * inside `sas/`, so a tree upgraded from that release carries a directory
 * nothing reads. `sas:copy` no longer copies it - it takes only `sas/sasautos` -
 * so this is tidying an upgraded tree, not keeping the build clean.
 *
 * The folders are parameters so a spec can run the function against a temp tree
 * - a clean checkout never has the legacy cache, so no CI leg would otherwise
 * reach the deletion.
 */
export const copySASjsCore = async (
  folder: string = sasJSCoreMacros,
  coreFolder: string = macroCorePath
) => {
  await deleteFolder(path.join(path.dirname(folder), 'sasautos-download'))

  await deleteFolder(folder)
  await createFolder(folder)

  const foldersToCopy = ['base', 'ddl', 'fcmp', 'lua', 'server']

  await asyncForEach(foldersToCopy, async (coreSubFolder) => {
    const coreSubFolderPath = path.join(coreFolder, coreSubFolder)

    await copy(coreSubFolderPath, folder)
  })

  const fileNames = await listFilesInFolder(folder)

  await createFile(path.join(folder, '.macrolist'), fileNames.join('\n'))
}

// Run only when invoked as a script, so a spec can import the function above
// without rebuilding the api's macros folder.
if (require.main === module) copySASjsCore()
