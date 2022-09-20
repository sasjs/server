import { RunTimeType } from '../../../context/appContext'

export const getLanguageFromExtension = (extension: string) => {
  if (extension === 'js') return 'javascript'

  if (extension === 'ts') return 'typescript'

  if (extension === 'md' || extension === 'mdx') return 'markdown'

  return extension
}

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
      return `%let _program = '${path}';\n${code}`
    }
  }

  return code
}
