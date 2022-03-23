import path from 'path'
import {
  asyncForEach,
  createFile,
  createFolder,
  deleteFolder,
  readFile
} from '@sasjs/utils'

import { getTmpMacrosPath, sasJSCoreMacros, sasJSCoreMacrosInfo } from '.'

export const copySASjsCore = async () => {
  console.log('Copying Macros from container to drive(tmp).')

  const macrosDrivePath = getTmpMacrosPath()

  await deleteFolder(macrosDrivePath)
  await createFolder(macrosDrivePath)

  const macros = await readFile(sasJSCoreMacrosInfo)

  await asyncForEach(macros.split('\n'), async (macroName) => {
    const macroFileSourcePath = path.join(sasJSCoreMacros, macroName)
    const macroContent = await readFile(macroFileSourcePath)

    const macroFileDestPath = path.join(macrosDrivePath, macroName)

    await createFile(macroFileDestPath, macroContent)
  })

  console.log('Macros Drive Path:', macrosDrivePath)
}
