/**
 * Asserts the run time Studio picks for a file, and that opening a file moves it.
 *
 * A host can carry several run times side by side - `services/x.sas` and `services/x.js` under
 * the same folder - so the file in front of the user decides which one runs it. When its
 * extension names none of the host's run times, the host's first run time applies, which is the
 * priority SASjs Server documents for `RUN_TIMES` (`docs/pages/settings.md`).
 *
 * The rule is half of the feature. The other half is the hook's effect, and it is tested here
 * too: `applyRunTimeSelection` is what the effect calls, driven with a spy setter, so the
 * selection moving with the file is pinned rather than inferred from the rule.
 *
 * Run with `npm run test:runtime`.
 */
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { applyRunTimeSelection, runTimeForPath } =
  await import('../src/containers/Studio/internal/runTime.ts')

// the one definition of a path's extension, which the Studio also uses for the icon, the
// picture preview, the JSON formatting and the SAS lint
const { extensionOf } = await import('../src/utils/files.ts')

const failures = []
const check = (label, actual, expected) => {
  if (actual !== expected) failures.push(`${label}: ${actual} !== ${expected}`)
}

check('the extension of a sas file', extensionOf('/a/b/report.sas'), 'sas')
check('a js file', extensionOf('/a/b/service.js'), 'js')
check('upper case', extensionOf('/a/b/REPORT.SAS'), 'sas')
check('no extension', extensionOf('/a/b/program'), '')
check('a dotfile names no extension', extensionOf('/a/b/.sasjsrc'), '')
check('a dotted folder is not the extension', extensionOf('/a.b/program'), '')

const browserMock = ['js', 'sas']
const sasServer = ['sas', 'js', 'py']

// the file decides, on either host
check(
  'sas file on a js-first host',
  runTimeForPath('/a/report.sas', browserMock),
  'sas'
)
check(
  'sas file on a sas-first host',
  runTimeForPath('/a/report.sas', sasServer),
  'sas'
)
check(
  'js file on a sas-first host',
  runTimeForPath('/a/service.js', sasServer),
  'js'
)

// an extension the host does not run falls back to its first run time
check('an unknown extension', runTimeForPath('/a/notes.txt', browserMock), 'js')
check('no extension at all', runTimeForPath('/a/program', sasServer), 'sas')
check('no path', runTimeForPath('', browserMock), 'js')

// ---- the effect the hook runs ----------------------------------------------
/** Drive the effect with a spy setter, reporting what it set. */
const whenOpening = (filePath, runTimes) => {
  const set = []

  applyRunTimeSelection((runTime) => set.push(runTime), filePath, runTimes)

  return set
}

check(
  'opening a .sas file on a js-first host selects sas',
  JSON.stringify(whenOpening('/a/report.sas', browserMock)),
  '["sas"]'
)
check(
  'opening a .js file on a sas-first host selects js',
  JSON.stringify(whenOpening('/a/service.js', sasServer)),
  '["js"]'
)
check(
  'opening a file the host cannot run selects its first run time',
  JSON.stringify(whenOpening('/a/notes.txt', browserMock)),
  '["js"]'
)
check(
  'opening an unsaved buffer selects the host default',
  JSON.stringify(whenOpening('', sasServer)),
  '["sas"]'
)

// a host with no run times leaves the selection where it was rather than blanking it
check(
  'a host with no run times changes nothing',
  JSON.stringify(whenOpening('/a/report.sas', [])),
  '[]'
)

if (failures.length) {
  console.error(`Run time: ${failures.length} failure(s)`)
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}

console.log(
  'Run time: the file extension decides, the host run times are the fallback, and opening a file moves the selection'
)
