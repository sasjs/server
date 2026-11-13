import { RunTimeType } from '../../../context/appContext'

// The languages live in language.ts: the drive's `.sasjslint` is JSON with no
// extension, so the decision needs the file name as well as the extension.
export { languageForFile } from './language'

export const getSelection = (editor: any) => {
  const selection = editor?.getModel().getValueInRange(editor?.getSelection())
  return selection ?? ''
}

export const programPathInjection = (
  code: string,
  path: string,
  runtime: RunTimeType
) => {
  if (path) {
    if (runtime === RunTimeType.JS) {
      return `const _PROGRAM = '${path}';\n${code}`
    }
    if (runtime === RunTimeType.PY) {
      return `_PROGRAM = '${path}';\n${code}`
    }
    if (runtime === RunTimeType.R) {
      return `._PROGRAM = '${path}';\n${code}`
    }
    if (runtime === RunTimeType.SAS) {
      return `%let _program = ${path};\n${code}`
    }
  }

  return code
}
