import path from 'path'
import {
  asyncForEach,
  copy,
  createFile,
  createFolder,
  deleteFolder,
  listFilesInFolder
} from '@sasjs/utils'

import {
  apiRoot,
  sasJSCoreMacros,
  sasJSCoreMacrosInfo
} from '../src/utils/file'

const macroCorePath = path.join(apiRoot, 'node_modules', '@sasjs', 'core')

export const copySASjsCore = async () => {
  await deleteFolder(sasJSCoreMacros)
  await createFolder(sasJSCoreMacros)

  const foldersToCopy = ['base', 'ddl', 'fcmp', 'lua', 'server']

  await asyncForEach(foldersToCopy, async (coreSubFolder) => {
    const coreSubFolderPath = path.join(macroCorePath, coreSubFolder)

    await copy(coreSubFolderPath, sasJSCoreMacros)
  })

  const fileNames = await listFilesInFolder(sasJSCoreMacros)

  await createFile(sasJSCoreMacrosInfo, fileNames.join('\n'))
}

copySASjsCore()
