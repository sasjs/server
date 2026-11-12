/**
 * Asserts how the Code tab's lint list reads the editor's markers: the counts,
 * the order the findings keep, the one-line summary, and which buffers the SAS
 * rules judge at all.
 *
 * The list and the squiggles come from one marker set, so this is a view of what
 * Monaco was handed - a wrong count here is a panel that disagrees with the code
 * under it. Run with `npm run test:lintissues`.
 */
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const {
  SEVERITY_ERROR,
  SEVERITY_HINT,
  SEVERITY_INFO,
  SEVERITY_WARNING,
  describeLintSummary,
  summariseLintIssues
} = await import('../src/containers/Studio/internal/lintIssues.ts')

const { lintAppliesTo } =
  await import('../src/containers/Studio/internal/lintScope.ts')

const failures = []
const check = (label, condition) => {
  if (!condition) failures.push(label)
}

// Monaco's IMarkerData shape, as toMarkers produces it.
const marker = (lineNumber, severity, message) => ({
  startLineNumber: lineNumber,
  startColumn: 1,
  endLineNumber: lineNumber,
  endColumn: 2,
  message,
  severity
})

const markers = [
  marker(3, SEVERITY_WARNING, 'trailing space'),
  marker(7, SEVERITY_ERROR, 'unknown macro'),
  marker(9, SEVERITY_INFO, 'max line length'),
  marker(12, SEVERITY_HINT, 'consider doxygen header')
]

const summary = summariseLintIssues(markers)

check('every marker is a finding', summary.issues.length === 4)
check('errors are counted', summary.errors === 1)
check('warnings are counted', summary.warnings === 1)
check('infos are counted', summary.infos === 1)
check('hints are counted', summary.hints === 1)
check(
  'findings keep the editor order, which is by line',
  summary.issues.map((issue) => issue.lineNumber).join(',') === '3,7,9,12'
)
check(
  'a finding carries the message and the severity',
  summary.issues[1].message === 'unknown macro' &&
    summary.issues[1].severity === SEVERITY_ERROR
)

check(
  'the summary names each severity present, in triage order',
  describeLintSummary(summary) === '1 error, 1 warning, 1 info, 1 hint'
)

const twoErrors = summariseLintIssues([
  marker(1, SEVERITY_ERROR, 'a'),
  marker(2, SEVERITY_ERROR, 'b')
])
check(
  'a count of two is pluralised',
  describeLintSummary(twoErrors) === '2 errors'
)

check(
  'an empty marker set is an empty summary',
  summariseLintIssues([]).issues.length === 0 &&
    describeLintSummary(summariseLintIssues([])) === ''
)

// The SAS rules are the only rules the endpoint applies, so a buffer in another
// run time is left unmarked - and, in the hook, clears what the panel held. A
// .js file open beside a .sas program was reported with that program's findings
// before the buffer was asked this question at all.
check(
  'a .sas file is judged by the SAS rules',
  lintAppliesTo('/a/b/run.sas', 'js')
)
check(
  'a .js file is not, whatever run time is selected',
  !lintAppliesTo('/a/b/run.js', 'sas')
)
check('a .py file is not', !lintAppliesTo('/a/b/run.py', 'sas'))
check(
  'an untitled buffer follows the selected run time',
  lintAppliesTo('', 'sas')
)
check(
  'an untitled buffer is left alone when the selection is not SAS',
  !lintAppliesTo('', 'js')
)
check('upper case still names SAS', lintAppliesTo('/a/b/RUN.SAS', 'js'))

if (failures.length) {
  console.error(`lint issues: ${failures.length} check(s) failed`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('lint issues: all checks passed')
