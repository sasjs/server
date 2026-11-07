/**
 * Asserts the classification the `webout` tab previews on: a page is rendered in
 * a sandboxed iframe, everything else stays text. Getting this wrong in either
 * direction is visible to the reader - a JSON webout rendered as a page collapses
 * to one line, and a page rendered as text is a wall of markup.
 *
 * Run with `npm run test:webout`.
 */
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { isHtmlOutput, parseJsonOutput, prettyJsonOutput } =
  await import('../src/utils/webout.ts')

const failures = []
const check = (label, condition) => {
  if (!condition) failures.push(label)
}

check(
  'an ODS page is a page',
  isHtmlOutput(
    '<!DOCTYPE html>\n<html><head><title>x</title></head><body></body></html>'
  )
)
check(
  'a page without a doctype is a page',
  isHtmlOutput('<html><body><p>hello</p></body></html>')
)
check(
  'an output fragment is a page',
  isHtmlOutput('<table class="x"><tr><td>1</td></tr></table>')
)
check(
  'a page that starts with whitespace is a page',
  isHtmlOutput('\n\n  <div>hello</div>')
)
check(
  'a chart page with an image is a page',
  isHtmlOutput('<img src="data:image/png;base64,iVBORw0KGgo=" />')
)

check(
  'a JSON webout is text',
  !isHtmlOutput('{"SYSUSERID":"sasjs","data":[{"x":1}]}')
)
check('an indented JSON webout is text', !isHtmlOutput('\n  [{"x":1}]'))
check('a printed line is text', !isHtmlOutput('NOTE: 19 observations read.'))
check('a CSV webout is text', !isHtmlOutput('a,b\n1,2'))
check('an empty webout is text', !isHtmlOutput(''))
check(
  'text that merely mentions a tag is text',
  !isHtmlOutput('NOTE: the value <b> is not allowed here.')
)

// JSON: an object or an array is a document; anything else is text.
const object = '{"a":1,"b":[1,2],"c":{"d":"e"}}'
const array = '[{"id":1},{"id":2}]'

check('a JSON object is a document', parseJsonOutput(object) !== null)
check('a JSON array is a document', parseJsonOutput(array) !== null)
check(
  'a JSON document with surrounding whitespace is a document',
  parseJsonOutput(`\n  ${object}\n`) !== null
)
check(
  'a page that starts with markup is not JSON',
  parseJsonOutput('<html><body>{}</body></html>') === null
)
check('a JSON document is not a page', !isHtmlOutput(object))
check('invalid JSON is text', parseJsonOutput('{"a":') === null)
check('an empty webout is text', parseJsonOutput('') === null)
check('whitespace only is text', parseJsonOutput('  \n ') === null)
check('a printed line is text', parseJsonOutput('NOTE: hello') === null)
// JSON scalars are text: there is nothing to indent, and a program writing one
// wrote a line, not a document
check('a bare number is not a document', parseJsonOutput('123') === null)
check('a bare string is not a document', parseJsonOutput('"hello"') === null)
check('bare true is not a document', parseJsonOutput('true') === null)
check('bare null is not a document', parseJsonOutput('null') === null)

const pretty = prettyJsonOutput(object)
check(
  'the pretty form is indented',
  pretty !== null && pretty.includes('\n  "a": 1')
)
check(
  'the pretty form carries the same data',
  pretty !== null &&
    JSON.parse(pretty) !== null &&
    JSON.stringify(JSON.parse(pretty)) === object
)
check(
  'there is no pretty form for text',
  prettyJsonOutput('NOTE: hello') === null
)
check('there is no pretty form for a scalar', prettyJsonOutput('123') === null)
check(
  'a single line document is one line when pretty',
  prettyJsonOutput('{}')?.replace(/\s/g, '') === '{}'
)

// Indenting is a re-serialisation, and a parse is lossy at the edges - which
// is why RAW stays one click away. Pinned so the docs cannot drift from the
// behaviour.
const lossy = prettyJsonOutput('{"big":9007199254740993,"exp":1e999,"neg":-0}')
check(
  'the formatted view rounds an integer past MAX_SAFE_INTEGER',
  lossy !== null && lossy.includes('9007199254740992')
)
check(
  'the formatted view turns an out-of-range exponent into null',
  lossy !== null && /"exp": null/.test(lossy)
)

if (failures.length) {
  console.error(`webout preview: ${failures.length} check(s) failed`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('webout preview: all checks passed')
