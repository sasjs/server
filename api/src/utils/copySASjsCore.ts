import { copy, createFolder } from '@sasjs/utils'

import { getTmpMacrosPath, sasJSCoreMacros } from '.'

export const copySASjsCore = async () => {
  await createFolder(sasJSCoreMacros)

  const macrosDrivePath = getTmpMacrosPath()
  await copy(sasJSCoreMacros, macrosDrivePath)
}
