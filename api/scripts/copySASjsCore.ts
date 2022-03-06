import path from 'path'
import { asyncForEach, copy, createFolder, deleteFolder } from '@sasjs/utils'

import { apiRoot, sasJSCoreMacros } from '../src/utils'

const macroCorePath = path.join(apiRoot, 'node_modules', '@sasjs', 'core')

export const copySASjsCore = async () => {
  await deleteFolder(sasJSCoreMacros)
  await createFolder(sasJSCoreMacros)

  const foldersToCopy = ['base', 'ddl', 'fcmp', 'lua', 'server']

  await asyncForEach(foldersToCopy, async (coreSubFolder) => {
    const coreSubFolderPath = path.join(macroCorePath, coreSubFolder)

    await copy(coreSubFolderPath, sasJSCoreMacros)
  })
}

copySASjsCore()
