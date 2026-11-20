/**
 * Runs `scripts/lintFixesWithEngine.mjs`, which asserts what the layout engine
 * does to the findings the fixes-only pass leaves alone.
 *
 * The formatting half of the documented behaviour cannot live in a jest case:
 * `@sasjs/sas-language` is ES modules, and jest's runtime refuses to load it
 * with `createRequireEsmError`. Spawning Node for it keeps the assertion real
 * instead of dropping it, and the script's own exit status carries the verdict.
 */
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

it('the layout engine re-indents a tab and splits an over-long call', () => {
  const output = execFileSync(
    process.execPath,
    [join(process.cwd(), 'scripts', 'lintFixesWithEngine.mjs')],
    { encoding: 'utf8' }
  )

  expect(output).toContain('10 checks passed')
}, 60000)
