/**
 * Asserts the log issue pass: what the Studio's log viewer lists, and the lines
 * it marks. The parsing itself belongs to `@sasjs/utils/logs` and is tested
 * there, so these checks are about the shape the viewer consumes - the three
 * lists, the anchors the tree clicks resolve, and the fact that a note is never
 * coloured.
 *
 * Run with `npm run test:logissues`.
 */
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { parseErrorsAndWarnings } = await import('../src/utils/log.ts')

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

const { errors, warnings, notes, logLines } = parseErrorsAndWarnings(LOG)

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
  'each error is anchored as <type>_<index>, which is what the tree scrolls to',
  logLines[6].startsWith('<font id="error_0"') &&
    logLines[8].startsWith('<font id="error_1"')
)
check(
  'the warning line is anchored',
  logLines[4].startsWith('<font id="warning_0"')
)
check('an error is coloured red', logLines[6].includes('color: red'))
check('a warning is coloured green', logLines[4].includes('color: green'))

check(
  'a note is anchored, so its tree entry scrolls to it',
  logLines[5].startsWith('<font id="note_0"') &&
    logLines[7].startsWith('<font id="note_1"')
)
check('a note is not coloured', !logLines[5].includes('color:'))

check('the line count is unchanged by marking', logLines.length === 10)
check('a plain line is passed through', logLines[1] === '1    data want;')

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
  empty.errors.length === 0 && empty.logLines.length === 1
)

if (failures.length) {
  console.error(`log issues: ${failures.length} check(s) failed`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('log issues: all checks passed')
