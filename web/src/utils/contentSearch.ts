/**
 * The bodies of the drive's text files, for a search that asks what is INSIDE a
 * folder's files.
 *
 * The drive search matches a file's own name and the folders above it, from the
 * listing the walk collects - no request per file. A reader who right-clicks a
 * folder and searches it is asking a different question, and the API has one way
 * to answer it: one file per request, through the route the editor opens a file
 * with. So a folder search reads its files, and this file is the rule for which
 * files are worth reading, where in a file a query matched, and how much of the
 * folder one search reads.
 *
 * The reader is injected, as `walkDrivePaths`'s folder reader is, so a node
 * script can hand over a fixture map instead of a server - see
 * `scripts/test-content-search.mjs`.
 */
import type { DriveFileKind } from './files'
import { driveFileKindOf } from './files'
import type { FileText } from './search'

/**
 * The kinds of drive file whose body is text.
 *
 * The kinds come from `driveFileKindOf`, so a format added to the tree's icons is
 * judged here without a second list: a picture, a SAS dataset, a spreadsheet, a
 * document and an archive are bytes a search cannot read, and a program, a
 * script, markup, config, a log and prose are text. A `.csv` is text too, and it
 * is deliberately out: a table is the one text format on a drive that runs to
 * megabytes, and reading it to answer "which file mentions orders" costs more
 * than the answer is worth. A drive's own `.sasjslint` is config, and the tree
 * already treats it as such.
 */
const TEXT_KINDS: DriveFileKind[] = [
  'program',
  'script',
  'markup',
  'config',
  'log',
  'text'
]

/** Whether a drive path is a file whose body this search can read. */
export const isSearchableText = (filePath: string): boolean => {
  const kind = driveFileKindOf(filePath)

  return kind !== null && TEXT_KINDS.includes(kind)
}

/**
 * How many files one folder search reads.
 *
 * A folder search is one request per file, so the cap is what keeps a
 * right-click on the drive root from becoming a thousand requests. A reader
 * whose folder holds more than this is told how many files were left unread
 * rather than shown a short list that claims to be complete.
 */
export const MAX_CONTENT_FILES = 200

/**
 * How much of each file is searched: the first 256 KB.
 *
 * A log or a generated program can run to tens of megabytes, and the line a
 * reader is looking for is far more often near the top than in the last
 * kilobyte. The cap is reported the same way the file cap is, so a search that
 * did not read a whole file says so.
 *
 * KB, not characters: a body arrives as a JavaScript string, whose `length` counts
 * UTF-16 code units, and a file of accented text is two to three bytes per
 * character in the encoding it is stored in. Measuring the string would let a
 * 700 KB file through as "under 256 KB" and search three times what it promised
 * - see `withinBytes`.
 */
export const MAX_CONTENT_BYTES = 256 * 1024

/** UTF-8, because that is what the cap is stated in. */
const encoder = new TextEncoder()

/**
 * The most of a body that fits the byte budget, and whether anything was cut.
 *
 * A string longer than the budget in code units is over it in bytes without
 * needing to be encoded at all: UTF-8 spends at least one byte per code unit, so
 * only a body that could fit is worth measuring - which keeps a 10 MB log from
 * being encoded in full just to find out that it is too long.
 *
 * The cut is found by bisecting the length rather than by scaling one estimate:
 * the split is where the encoded prefix stops fitting, and a body that is mostly
 * ASCII with one long run of CJK text has no single ratio that finds it. Each
 * step encodes a prefix of at most the budget, and a surrogate pair is never left
 * half in the result, so a cut cannot end a body in a broken character.
 */
const withinBytes = (
  text: string,
  bytes: number = MAX_CONTENT_BYTES
): { text: string; clipped: boolean } => {
  if (text.length <= bytes && encoder.encode(text).length <= bytes)
    return { text, clipped: false }

  let low = 0
  let high = Math.min(text.length, bytes)

  while (low < high) {
    const middle = Math.ceil((low + high) / 2)

    if (encoder.encode(text.slice(0, middle)).length <= bytes) low = middle
    else high = middle - 1
  }

  // a high surrogate at the cut is the first half of a character whose second
  // half is being left out; ending before it keeps the prefix readable
  if (
    low > 0 &&
    text.charCodeAt(low - 1) >= 0xd800 &&
    text.charCodeAt(low - 1) <= 0xdbff
  )
    low -= 1

  return { text: text.slice(0, low), clipped: true }
}

/** How much of a matching line a result shows. */
export const SNIPPET_LENGTH = 160

/**
 * How much text one folder scan keeps from the whole folder: about 4 million
 * characters.
 *
 * The bodies a scan reads are kept for the rest of the page session, so the cap
 * that protects the tab is on the total rather than on the file: two hundred logs
 * of 256 KB each is tens of megabytes held in memory to answer a query the reader
 * has already typed, and a folder search is a request the reader made about one
 * folder, not a reason to keep it all. A folder larger than this is searched up to
 * the budget, and the count of files left unread is shown beside the results.
 */
export const MAX_SCAN_TEXT = 4 * 1024 * 1024

/** How many files are read at once, as a walk reads folders at once. */
export const READ_CONCURRENCY = 6

/** Where in a file the query matched, and the line itself. */
export interface Snippet {
  /** 1-based, as an editor numbers its lines. */
  line: number
  text: string
}

/**
 * The part of a line worth showing beside a result.
 *
 * A matching line is shown from its first non-blank character, because leading
 * indentation says nothing in a one-line result and would push the matched word
 * out of the line's width. A line longer than the window is cut around the match
 * rather than at its end: a `%let` at column 300 of a generated line is what the
 * reader is looking for, and the end of that line would not contain it.
 */
const clip = (line: string, needle: string): string => {
  const trimmed = line.trim()

  if (trimmed.length <= SNIPPET_LENGTH) return trimmed

  const at = trimmed.toLowerCase().indexOf(needle)
  // the window starts far enough before the match to show what leads into it,
  // and never before the beginning of the line
  const start = Math.max(0, Math.min(at - 40, trimmed.length - SNIPPET_LENGTH))
  const cut = trimmed.slice(start, start + SNIPPET_LENGTH)

  return `${start > 0 ? '…' : ''}${cut}${start + SNIPPET_LENGTH < trimmed.length ? '…' : ''}`
}

/**
 * The first line of a text that contains the query, or null for a file that does
 * not mention it.
 *
 * The first match, not every one: a result list is a list of files, and eleven
 * lines from one file would push the file that answers the question off it. The
 * line count is what tells the reader it is the file they mean - a `%let` at line
 * three of a short program reads differently from one at line 900 of a log.
 */
export const snippetIn = (text: string, query: string): Snippet | null => {
  const needle = query.trim().toLowerCase()

  if (needle.length < 2) return null

  const lines = text.split(/\r?\n/)

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]

    if (line.toLowerCase().includes(needle))
      return { line: index + 1, text: clip(line, needle) }
  }

  return null
}

/** Reads one file's body as text, or answers null for one it cannot. */
export type ReadTextFile = (filePath: string) => Promise<string | null>

/** How far a scan has got, for a box that says what it is doing. */
export type ScanProgress = (done: number, total: number) => void

export interface Scan {
  /** The bodies that were read, in path order. */
  contents: FileText[]
  /** Text files the folder holds, whether or not this scan read them. */
  readable: number
  /** Readable files the search did not read, because a cap stopped it. */
  skipped: number
  /** Which cap stopped it, for a box that says what it left out. */
  stopped: 'files' | 'text'
  /** Bodies that were cut at `MAX_CONTENT_BYTES`. */
  clipped: number
  /** Files the drive refused, or that had gone since the walk. */
  unreadable: number
}

/**
 * The bodies of a folder's text files, a few files at a time.
 *
 * Only the files a search can read are asked for (`isSearchableText`), and only
 * the first `MAX_CONTENT_FILES` of those, so a folder search costs one request
 * per text file rather than one per entry. A file that cannot be read - a
 * refusal, a file removed since the walk - is a file this search has nothing to
 * say about, and nothing more: the rest of the folder is still worth reading, so
 * it is counted rather than thrown.
 *
 * The scan stops at `MAX_SCAN_TEXT` as well as at the file cap, because what it
 * reads is kept for the rest of the page session: a folder of two hundred logs
 * would otherwise hold tens of megabytes of text in a tab. Files it did not reach
 * are counted, and `stopped` says which cap ran out, so the box can tell the
 * reader which files were not searched rather than implying there were none.
 *
 * Concurrency is clamped the way the walk clamps it, so a malformed limit cannot
 * stall the scan or open a connection per file.
 */
export const readContents = async (
  files: string[],
  read: ReadTextFile,
  onProgress?: ScanProgress,
  concurrency: number = READ_CONCURRENCY
): Promise<Scan> => {
  const limit = Number.isFinite(concurrency)
    ? Math.max(1, Math.floor(concurrency))
    : READ_CONCURRENCY
  const readable = files.filter(isSearchableText)
  const candidates = readable.slice(0, MAX_CONTENT_FILES)
  const contents: FileText[] = []
  let clipped = 0
  let unreadable = 0
  let held = 0
  let taken = 0
  let done = 0
  let stopped: Scan['stopped'] = 'files'

  const worker = async (): Promise<void> => {
    // `held` is checked before a file is taken, so the scan stops asking as soon
    // as what it holds fills the budget; the workers already in flight can put it
    // over by at most one body each, which is the price of reading in parallel
    while (taken < candidates.length && held < MAX_SCAN_TEXT) {
      const filePath = candidates[taken]
      taken += 1

      const text = await read(filePath).catch(() => null)

      done += 1

      if (text === null || text === undefined) unreadable += 1
      else {
        const fitted = withinBytes(text)

        if (fitted.clipped) clipped += 1

        held += fitted.text.length
        contents.push({ path: filePath, text: fitted.text })
      }

      onProgress?.(done, candidates.length)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, candidates.length) }, worker)
  )

  // what was left out, and which cap was the reason: a folder over the file cap
  // has more files than one search reads, and one over the text budget has more
  // text than a tab should hold
  if (taken < candidates.length)
    stopped = held >= MAX_SCAN_TEXT ? 'text' : 'files'

  // the workers finish in whatever order the drive answered, and a result list
  // must not reshuffle between two searches of the same folder
  contents.sort((first, second) => first.path.localeCompare(second.path))

  return {
    contents,
    readable: readable.length,
    skipped: readable.length - taken,
    stopped,
    clipped,
    unreadable
  }
}
