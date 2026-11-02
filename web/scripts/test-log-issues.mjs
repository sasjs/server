/**
 * Asserts the log reading pass: the issues the Studio lists, and the pieces its
 * viewer renders. The parsing itself belongs to `@sasjs/utils/logs` and is tested
 * there, so these checks are about the shape the viewer consumes - the three
 * lists, the anchors the tree clicks resolve, the chunks a large log is cut
 * into, and the fact that a log is rendered as text.
 *
 * Run with `npm run test:logissues`.
 */
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const {
  parseErrorsAndWarnings,
  countLines,
  splitIntoChunks,
  buildLogSegments
} = await import('../src/utils/log.ts')

const failures = []
const check = (label, condition) => {
  if (!condition) failures.push(label)
}

const LOG = [
  'NOTE: SAS (r) Proprietary Software 9.4 (TS1M9 MBCS3170)',
  '1    data want;',
  '2      x = age / 0;',
  '3    run;',
  'WARNING: Division by zero detected at line 3 column 11.',
  'NOTE: Variable y is uninitialized.',
  'ERROR Libref X is not assigned.',
  'NOTE 49-169: The meaning of an identifier after a quoted string may change.',
  'ERROR: File WORK.MISSING_DS.DATA does not exist.',
  ''
].join('\n')

const { errors, warnings, notes } = parseErrorsAndWarnings(LOG)

check('the colon-less error is found', errors.length === 2)
check('the warning is found', warnings.length === 1)
check('the notable notes are found', notes.length === 2)

check(
  'an error carries the message without the marker',
  errors[0].body === 'Libref X is not assigned.'
)
check('an error records the line it sits on', errors[0].line === 6)
check(
  'a coded note keeps its code',
  notes.some((note) => note.code === '49-169')
)
check(
  'each issue is anchored as <type>_<index>, which is what the tree scrolls to',
  errors[0].id === 0 &&
    errors[1].id === 1 &&
    warnings[0].id === 0 &&
    notes[1].id === 1
)

// A log with nothing to report must produce no lists at all, so the viewer shows
// no tree rather than an empty one.
const quiet = parseErrorsAndWarnings(
  [
    'NOTE: There were 19 observations read from the data set SASHELP.CLASS.',
    ''
  ].join('\n')
)
check('a quiet log lists no errors', quiet.errors.length === 0)
check('a quiet log lists no warnings', quiet.warnings.length === 0)
check('a quiet log lists no notes', quiet.notes.length === 0)

// An empty log is what an aborted run hands over.
const empty = parseErrorsAndWarnings('')
check(
  'an empty log lists nothing',
  empty.errors.length === 0 &&
    empty.warnings.length === 0 &&
    empty.notes.length === 0
)

// Line counting drives the chunk labels and the scroll target, and must not need
// the log split into one string per line.
check('a log is counted by its newlines', countLines(LOG) === 9)
check(
  'a log without a trailing newline counts its last line',
  countLines('a\nb') === 2
)
check('a one line log is one line', countLines('a') === 1)
check('an empty log is no lines', countLines('') === 0)

// Chunks are substrings of the log, so a large log is not copied line by line.
const lines = Array.from({ length: 25 }, (_, i) => `line ${i}`)
const bigLog = lines.join('\n')

const chunks = splitIntoChunks(bigLog, 10)
check('a log is cut into chunks of the requested size', chunks.length === 3)
check('the chunks hold the log in order', chunks.join('\n') === bigLog)
check('a chunk is a substring of the log', bigLog.includes(chunks[1]))
check('an empty log has no chunks', splitIntoChunks('').length === 0)
check(
  'a log shorter than a chunk is one chunk',
  splitIntoChunks(bigLog, 1000).length === 1
)

// The pieces the viewer renders: one per anchored line, plus one per run of
// lines between anchors - never one per line of the log.
const markers = [{ body: 'boom', line: 12, endLine: 12, type: 'error', id: 0 }]
const segments = buildLogSegments(chunks[1], 10, markers)

check('a run of lines before an anchor is one piece', segments.length === 3)
check(
  'the anchor sits on the line it names',
  segments[1].marker?.body === 'boom' && segments[1].text === 'line 12'
)
check(
  'the lines around an anchor are kept in order',
  segments[0].text === ['line 10', 'line 11'].join('\n') &&
    segments[2].text ===
      [
        'line 13',
        'line 14',
        'line 15',
        'line 16',
        'line 17',
        'line 18',
        'line 19'
      ].join('\n')
)
check(
  'a chunk with nothing to anchor is one piece',
  buildLogSegments(chunks[0], 0, markers).length === 1
)
check(
  'an anchor outside the chunk does not split it',
  buildLogSegments(chunks[0], 0, markers)[0].text === chunks[0]
)

// The regression this pass exists for: a SAS log carries markup-like text, and
// it must reach the browser as text - a doxygen header in an embedded macro, and
// the `<` of a comparison, are log content and not elements.
const xmlLog = [
  '734        ',
  '735          <h4> SAS Macros </h4>',
  '736        **/',
  '737    if age < 13 then group = "child";',
  ''
].join('\n')

const xmlSegments = buildLogSegments(xmlLog, 0, [])

check('a log is one piece when nothing is anchored', xmlSegments.length === 1)
check(
  'markup in the log is passed through exactly as SAS wrote it',
  xmlSegments[0].text === xmlLog
)
check(
  'no HTML is generated by the reading pass',
  !xmlSegments[0].text.includes('<font')
)

const xmlMarked = buildLogSegments(xmlLog, 0, [
  { body: 'boom', line: 1, endLine: 1, type: 'error', id: 3 }
])
check(
  'an anchored line keeps its own text, markup and all',
  xmlMarked[1].text === '735          <h4> SAS Macros </h4>'
)

if (failures.length) {
  console.error(`log issues: ${failures.length} check(s) failed`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('log issues: all checks passed')
