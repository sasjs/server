import { copy } from '@sasjs/utils'

import { getTmpMacrosPath, sasJSCoreMacros } from '.'

export const copySASjsCore = async () => {
  const macrosDrivePath = getTmpMacrosPath()
  await copy(sasJSCoreMacros, macrosDrivePath)
}
