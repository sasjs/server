import type { SyntheticEvent } from 'react'
import { parseLog } from '@sasjs/utils/logs/index.js'
import type { LogIssue } from '@sasjs/utils/logs/index.js'
import type { LogInstance } from './types'

const toInstance = (issue: LogIssue, id: number): LogInstance => ({
  body: issue.message,
  line: issue.line,
  endLine: issue.endLine,
  ...(issue.code ? { code: issue.code } : {}),
  type: issue.severity,
  id
})

/**
 * Finds the errors, the warnings and the notable notes of a SAS log.
 *
 * The parsing is `parseLog` from `@sasjs/utils`, the same function the VS Code
 * extension uses, so a log reads the same in both: `ERROR:`/`WARNING:` with or
 * without a message code, the colon-less form SAS also writes, wrapped lines
 * folded into one issue, ODS HTML markup understood, and notes only from the
 * closed notable list.
 *
 * Nothing here touches the log text: the log is handed to the viewer as SAS
 * wrote it, and the viewer anchors the lines these issues sit on. That keeps the
 * log a log - a doxygen header's `<h4> SAS Macros </h4>` is text, not markup.
 */
export const parseErrorsAndWarnings = (log: string) => {
  const issues = parseLog(log)

  const collect = (severity: LogIssue['severity']): LogInstance[] =>
    issues
      .filter((issue) => issue.severity === severity)
      .map((issue, id) => toInstance(issue, id))

  return {
    errors: collect('error'),
    warnings: collect('warning'),
    notes: collect('note')
  }
}

/** The number of lines in a log, without splitting it into one string per line. */
export const countLines = (log: string) => {
  if (log.length === 0) return 0

  let lines = 0

  for (let i = 0; i < log.length; i++) {
    if (log.charCodeAt(i) === 10) lines++
  }

  // A log that does not end in a newline has a last line without a separator.
  return log.charCodeAt(log.length - 1) === 10 ? lines : lines + 1
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

/**
 * Cuts a log into chunks of `chunkSize` lines, keeping each chunk a substring of
 * the log rather than an array of lines: a large log is only ever held once.
 * Chunk `n` holds the lines from `n * chunkSize` onwards, which is how the
 * viewer maps a scroll target back to the chunk it sits in.
 */
export const splitIntoChunks = (log: string, chunkSize = defaultChunkSize) => {
  if (!log) return []

  const chunks: string[] = []
  let chunkStart = 0
  let line = 0

  for (let i = 0; i < log.length; i++) {
    if (log.charCodeAt(i) !== 10) continue

    line++

    if (line % chunkSize === 0) {
      chunks.push(log.slice(chunkStart, i))
      chunkStart = i + 1
    }
  }

  if (chunkStart < log.length) chunks.push(log.slice(chunkStart))

  return chunks
}

/** A run of log lines the viewer can render as one piece. */
export interface LogSegment {
  /** The log text exactly as SAS wrote it - never markup. */
  text: string
  /** The issue anchored on this segment, when the segment is the line it sits on. */
  marker?: LogInstance
}

/**
 * Splits a chunk into the fewest pieces that still give every anchored line its
 * own element: the lines between two anchors share one text node, so a chunk
 * with three notable notes is five segments, not twenty thousand. A chunk with
 * nothing to anchor is one segment, and a long log costs the browser elements in
 * proportion to its issues rather than to its length.
 *
 * `firstLine` is the line the chunk starts on, so a `marker.line` is an index
 * into the log and not into the chunk.
 */
export const buildLogSegments = (
  text: string,
  firstLine = 0,
  markers: LogInstance[] = []
): LogSegment[] => {
  const byLine = new Map<number, LogInstance>()

  for (const marker of markers) {
    const index = marker.line - firstLine

    if (index < 0 || byLine.has(index)) continue

    byLine.set(index, marker)
  }

  if (byLine.size === 0) return [{ text }]

  const lines = text.split('\n')
  const segments: LogSegment[] = []
  let plainStart = 0

  const flushPlain = (end: number) => {
    if (end > plainStart) {
      segments.push({ text: lines.slice(plainStart, end).join('\n') })
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const marker = byLine.get(i)

    if (!marker) continue

    flushPlain(i)
    segments.push({ text: lines[i], marker })
    plainStart = i + 1
  }

  flushPlain(lines.length)

  return segments
}

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
