/**
 * Asserts what the layout engine does to the two findings the fixes-only pass
 * leaves alone, so `docs/pages/studio.md` and the `layout` help text can be
 * checked rather than trusted.
 *
 * This runs as a child process rather than a jest case because `@sasjs/sas-language`
 * is ES modules and jest's runtime refuses to load it (`createRequireEsmError`);
 * `api/src/utils/lintFixesEngine.spec.ts` starts this file and reads its exit
 * status. Run it directly with `node scripts/lintFixesWithEngine.mjs`.
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  formatText,
  lintText,
  LintConfig,
  DefaultLintConfiguration
} = require('@sasjs/lint')
const { formatText: engine } = await import('@sasjs/sas-language/format')

const config = new LintConfig(DefaultLintConfiguration)
const overLong = `%put ${'z'.repeat(300)};`
const source = ['data x;', '\t/* tab indented */', overLong, 'run;', ''].join(
  '\n'
)

const failures = []
const check = (label, condition) => {
  if (!condition) failures.push(label)
}

const fixesOnly = await formatText(source, config)
const formatted = await formatText(source, config, {
  reprint: (text, options) => engine(text, options)
})

// The fixes pass leaves both, and reports both.
check(
  'the fixes pass keeps the tab',
  fixesOnly.includes('\t/* tab indented */')
)
check(
  'the fixes pass leaves the over-long line whole',
  fixesOnly.includes(overLong)
)
const fixesOnlyFindings = (await lintText(fixesOnly, config)).map(
  (finding) => finding.message
)
check(
  'the fixes pass reports the tab',
  fixesOnlyFindings.some((message) => message.includes('tab character'))
)
check(
  'the fixes pass reports the length',
  fixesOnlyFindings.some((message) =>
    message.includes('exceeds maximum length')
  )
)

// Format re-indents the tab away and splits the over-long call after its
// keyword - the line is shorter but still over the limit, so it stays a finding.
check('Format removes the tab', !formatted.includes('\t'))
check(
  'Format re-indents with spaces',
  formatted.split('\n').includes('  /* tab indented */')
)
check(
  'Format leaves no tab finding',
  !(await lintText(formatted, config)).some((finding) =>
    finding.message.includes('tab character')
  )
)
check(
  'Format does not keep the over-long line whole',
  !formatted.includes(overLong)
)
check(
  'Format splits the call after its keyword',
  formatted.split('\n').some((line) => line.trim() === '%put')
)
check(
  'the split line is still reported',
  (await lintText(formatted, config)).some((finding) =>
    finding.message.includes('exceeds maximum length')
  )
)

if (failures.length) {
  console.error(`lintFixesWithEngine: ${failures.length} failed check(s)`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('lintFixesWithEngine: 10 checks passed')
