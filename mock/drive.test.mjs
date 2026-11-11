/**
 * The demo drive's programs, held to the rules the host runs them under.
 *
 * `mock/drive.json` is data, so nothing compiled it: the JS program it ships is
 * executed by the browser host exactly as written, and a program that calls
 * `webout()` wrongly answers a 400 in the published demo with no build or test
 * failing first. That is what happened - `webout(rows)` was refused with
 * `unknown action '[object Object],[object Object]'` long after the block moved
 * to OPEN / OBJ / CLOSE.
 *
 * So two things are asserted about every `.js` file in the drive: it parses (the
 * host evaluates it in the page's own engine, so a syntax error is a broken
 * demo), and every `webout(...)` call names one of the block's actions. The
 * shape is the same one `@sasjs/utils` generates for sasjs/server and for this
 * host's worker, which is why the check is worth having here rather than only in
 * the CLI's spec.
 *
 * The host's own tests live in sasjs/cli (its `sw.spec.ts` runs a program in this
 * shape against the real prelude block); this file guards the data that ships.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const drive = JSON.parse(readFileSync(path.join(root, 'mock', 'drive.json'), 'utf8'))
const files = drive.files ?? {}

/** The drive's JavaScript programs, keyed by the path a visitor sees. */
const programs = Object.entries(files).filter(([file]) => file.endsWith('.js'))

/** The actions `webout()` accepts, from @sasjs/utils' generated block. */
const ACTIONS = ['OPEN', 'ARR', 'OBJ', 'CLOSE']

/**
 * Every `webout(` call in a program, as the first argument it passes.
 *
 * Comment lines are dropped first: a program's own notes explain the call
 * (`webout() is not a data sink`), and a prose mention is not a call. `_sasjs_webout`
 * is the runtime's handle on the block, so the match requires a word boundary
 * before the name.
 */
const weboutCalls = (source) => {
  const calls = []
  const code = String(source)
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\/\*|\*|\*\/)/.test(line))
    .join('\n')
  const pattern = /\bwebout\s*\(\s*/g
  let match

  while ((match = pattern.exec(code))) {
    const rest = code.slice(match.index + match[0].length)
    const quoted = /^['"]([A-Za-z]+)['"]/.exec(rest)
    calls.push(quoted ? quoted[1] : rest.slice(0, 40).split('\n')[0])
  }

  return calls
}

test('the demo drive ships at least one JS program', () => {
  assert.ok(programs.length > 0, 'no .js program in mock/drive.json')
})

for (const [file, source] of programs) {
  const name = path.basename(file)

  test(`${name} parses as JavaScript`, () => {
    // `new Function` compiles without running: the host evaluates the program the
    // same way (runtime-core's runProgram), so this is the same failure it would
    // hit, found at build time instead of in front of a visitor
    assert.doesNotThrow(() => new Function(source), `${name} does not parse`)
  })

  test(`${name} calls webout() with an action`, () => {
    const calls = weboutCalls(source)

    for (const action of calls) {
      assert.ok(
        ACTIONS.includes(action),
        `${name}: webout(${action}) - the first argument must be one of ` +
          `${ACTIONS.join(', ')}. webout() is not a data sink: a bare array or ` +
          `object is refused by the block @sasjs/utils generates, on this host ` +
          `and on sasjs/server alike.`
      )
    }
  })
}
