/**
 * Asserts that lint diagnostics from `GET /SASjsApi/drive/lint` become the
 * markers Monaco expects.
 *
 * The mapping module imports Monaco as a type only, so it runs under plain node.
 * Run with `npm run test:markers`.
 */
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { LINT_MARKER_OWNER, toMarkers } = await import(
  '../src/containers/Studio/internal/lintMarkers.ts'
)

const failures = []
const check = (label, condition) => {
  if (!condition) failures.push(label)
}

// Severities as monaco.MarkerSeverity defines them.
const INFO = 2
const WARNING = 4
const ERROR = 8

const trailingSpace = {
  lineNumber: 6,
  startColumnNumber: 9,
  endColumnNumber: 9,
  message: 'Line contains trailing spaces',
  severity: 1
}

check('the marker owner is stable', LINT_MARKER_OWNER === 'sasjs-lint')
check('no diagnostics produce no markers', toMarkers([]).length === 0)

const [marker] = toMarkers([trailingSpace])

check(
  'the line is carried across',
  marker.startLineNumber === 6 && marker.endLineNumber === 6
)
check('the start column is carried across', marker.startColumn === 9)
// A lint rule reports the last offending character; a Monaco marker end is
// exclusive, so a one character violation covers exactly that character.
check('the end column is exclusive', marker.endColumn === 10)
check(
  'the message is carried across',
  marker.message === 'Line contains trailing spaces'
)
check('warning severity maps to warning', marker.severity === WARNING)

const severities = (severity) =>
  toMarkers([{ ...trailingSpace, severity }])[0].severity
check('info severity maps to info', severities(0) === INFO)
check('error severity maps to error', severities(2) === ERROR)
check('an unknown severity falls back to warning', severities(99) === WARNING)

const mapped = toMarkers([
  trailingSpace,
  { ...trailingSpace, lineNumber: 12, severity: 2 }
])
check('every diagnostic maps', mapped.length === 2)
check('each marker keeps its own line', mapped[1].startLineNumber === 12)
check('each marker keeps its own severity', mapped[1].severity === ERROR)

if (failures.length) {
  console.log(`${failures.length} failed:`)
  for (const failure of failures) console.log(`  FAIL  ${failure}`)
  process.exit(1)
}

console.log('SAS lint markers: all checks passed')
