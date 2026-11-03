/**
 * Pure-function tests for the JSON display helper the Studio opens a file with.
 *
 * The helper rewrites a file's text, so the cases that matter are the ones
 * where it must refuse: anything it cannot reproduce character for character is
 * left exactly as it is. Run with `npm run test:prettyjson`.
 */
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { prettyJson } =
  await import('../src/containers/Studio/internal/pretty.ts')

let checks = 0
const check = (label, fn) => {
  fn()
  checks++
  console.log('ok -', label)
}

check('indents a minified object', () => {
  assert.equal(
    prettyJson('{"a":1,"b":[1,2]}'),
    '{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}'
  )
})

check('keeps a trailing newline', () => {
  assert.equal(prettyJson('{"a":1}\n'), '{\n  "a": 1\n}\n')
})

check('leaves a file that is already indented alone', () => {
  const indented = '{\n    "a": 1\n}'

  assert.equal(prettyJson(indented), indented)
})

check('leaves text that is not JSON alone', () => {
  assert.equal(prettyJson('data _null_;'), 'data _null_;')
})

check('leaves an empty buffer alone', () => {
  assert.equal(prettyJson(''), '')
  assert.equal(prettyJson('  \n'), '  \n')
})

check('leaves a scalar alone', () => {
  assert.equal(prettyJson('42'), '42')
})

check('refuses a file whose numbers would not survive the round trip', () => {
  const big = '{"id":12345678901234567890}'

  assert.equal(JSON.stringify(JSON.parse(big)), '{"id":12345678901234567000}')
  assert.equal(prettyJson(big), big)
})

check('refuses a file with a duplicated key, whatever it holds', () => {
  // Both forms differ from the canonical minified text, so both are refused:
  // the helper only rewrites a file it can reproduce exactly.
  assert.equal(prettyJson('{"a":1,"a":2}'), '{"a":1,"a":2}')
  assert.equal(prettyJson('{"a":1,"a":1}'), '{"a":1,"a":1}')
})

console.log(`\n${checks} checks passed`)
