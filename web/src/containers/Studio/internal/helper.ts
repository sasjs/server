import { RunTimeType } from '../../../context/appContext'

/**
 * Monaco language ids, keyed by file extension. Monaco falls back to plain text
 * for any extension that is not listed here.
 */
const languageByExtension: Record<string, string> = {
  sas: 'sas',
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  r: 'r',
  sql: 'sql',
  md: 'markdown',
  mdx: 'markdown',
  json: 'json',
  html: 'html',
  css: 'css',
  yaml: 'yaml',
  xml: 'xml',
  sh: 'shell'
}

export const getLanguageFromExtension = (extension: string) =>
  languageByExtension[extension] ?? 'plaintext'

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
