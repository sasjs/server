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

const { isHtmlOutput } = await import('../src/utils/webout.ts')

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

if (failures.length) {
  console.error(`webout preview: ${failures.length} check(s) failed`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('webout preview: all checks passed')
