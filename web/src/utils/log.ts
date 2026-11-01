import type { SyntheticEvent } from 'react'
import { parseLog } from '@sasjs/utils/logs/index.js'
import type { LogIssue } from '@sasjs/utils/logs/index.js'
import type { LogInstance } from './types'

/** The colour a marker line is drawn in, by severity. Notes are not coloured. */
const MARKER_COLOURS: Record<string, string> = {
  error: 'red',
  warning: 'green'
}

/**
 * Wraps a line in the anchor and colour the log viewer uses to render it and to
 * scroll to it. The `id` is `<type>_<index>`, which is what the tree entries look
 * up when a reader clicks one.
 */
const markLine = (line: string, instance: LogInstance): string =>
  `<font id="${instance.type}_${instance.id}" style="color: ${MARKER_COLOURS[instance.type]};">${line}</font>`

const toInstance = (issue: LogIssue, id: number): LogInstance => ({
  body: issue.message,
  line: issue.line,
  endLine: issue.endLine,
  ...(issue.code ? { code: issue.code } : {}),
  type: issue.severity,
  id
})

/**
 * Finds the errors, the warnings and the notable notes of a SAS log, and marks the
 * lines they sit on.
 *
 * The parsing is `parseLog` from `@sasjs/utils`, the same function the VS Code
 * extension uses, so a log reads the same in both: `ERROR:`/`WARNING:` with or
 * without a message code, the colon-less form SAS also writes, wrapped lines
 * folded into one issue, ODS HTML markup understood, and notes only from the
 * closed notable list. This used to be a pair of regular expressions here, which
 * missed every one of those.
 *
 * The returned `logLines` carry the marker wrapping, so `body` is what the log
 * viewer renders - lines that are not issues are passed through untouched.
 */
export const parseErrorsAndWarnings = (log: string) => {
  const logLines = log.split('\n')
  const issues = parseLog(log)

  const collect = (severity: LogIssue['severity']): LogInstance[] =>
    issues
      .filter((issue) => issue.severity === severity)
      .map((issue, id) => toInstance(issue, id))

  const errors = collect('error')
  const warnings = collect('warning')
  const notes = collect('note')

  // Only errors and warnings are coloured: a log carries enough notes that
  // colouring them too would drown the two lines that stopped the run.
  for (const instance of [...errors, ...warnings]) {
    if (logLines[instance.line] !== undefined) {
      logLines[instance.line] = markLine(logLines[instance.line], instance)
    }
  }

  return { errors, warnings, notes, logLines }
}

export const defaultChunkSize = 20000

export const isTheLastChunk = (
  lineCount: number,
  chunkNumber: number,
  chunkSize = defaultChunkSize
) => {
  if (lineCount <= chunkSize) return true

  const chunksNumber = Math.ceil(lineCount / chunkSize)

  return chunkNumber === chunksNumber
}

export const splitIntoChunks = (log: string, chunkSize = defaultChunkSize) => {
  if (!log) return []

  const logLines: string[] = log.split(`\n`)

  if (logLines.length <= chunkSize) return [log]

  const chunks: string[] = []

  while (logLines.length) {
    const chunk = logLines.splice(0, chunkSize)

    chunks.push(chunk.join(`\n`))
  }

  return chunks
}

export const clearErrorsAndWarningsHtmlWrapping = (log: string) =>
  log.replace(/^<font[^>]*>/gm, '').replace(/<\/font>/gm, '')

export const download = (evt: SyntheticEvent, log: string, fileName = '') => {
  evt.stopPropagation()

  const padWithZero = (num: number) => (num < 9 ? `0${num}` : `${num}`)

  const date = new Date()
  const datePrefix = [
    date.getFullYear(),
    padWithZero(date.getMonth() + 1),
    padWithZero(date.getDate()),
    padWithZero(date.getHours()),
    padWithZero(date.getMinutes()),
    padWithZero(date.getSeconds())
  ].join('')

  const file = new Blob([log])
  const url = URL.createObjectURL(file)

  const a = document.createElement('a')
  a.href = url
  a.download = `${datePrefix}${fileName}.log`
  document.body.appendChild(a)
  a.click()

  setTimeout(() => {
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }, 0)
}
