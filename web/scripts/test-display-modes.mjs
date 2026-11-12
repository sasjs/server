/**
 * The pure half of the display modes: which files offer one, what the toggle
 * says, and the three renderings the panes draw.
 *
 * The panes themselves are React and are seen in the browser; what can be wrong
 * and impossible to see is here - a Markdown renderer that lets a `<script>` or a
 * `javascript:` link through, a CSV parser that splits a quoted field in two, a
 * JSON tree that loses a branch. Those are the failures this file pins.
 *
 * Run with `npm run test:displaymodes`.
 */
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const {
  DISPLAY_MODES,
  displayKindOf,
  displayModeLabel,
  displayModeStorageKey,
  displayModesFor,
  storedDisplayMode
} = await import('../src/containers/Studio/internal/displayMode.ts')

const { markdownToHtml, isSafeHref } =
  await import('../src/containers/Studio/internal/render/markdown.ts')
const { MAX_PREVIEW_ROWS, csvTable, parseCsv } =
  await import('../src/containers/Studio/internal/render/csv.ts')
const { jsonTreeOf } =
  await import('../src/containers/Studio/internal/render/jsonTree.ts')
const { formatJson } =
  await import('../src/containers/Studio/internal/render/jsonFormat.ts')
const { languageForFile } =
  await import('../src/containers/Studio/internal/language.ts')

const failures = []
const check = (label, condition) => {
  if (!condition) failures.push(label)
}

// --- which files get the choice -------------------------------------------

check(
  'markdown offers three modes',
  displayModesFor('/a/README.md').length === 3
)
check(
  'markdown, spelled out, is the same',
  displayModesFor('/a/notes.markdown').length === 3
)
check('csv offers three modes', displayModesFor('/a/orders.csv').length === 3)
check(
  'json offers three modes',
  displayModesFor('/a/sasjsconfig.json').length === 3
)
check('case does not matter', displayModesFor('/a/CONFIG.JSON').length === 3)
check(
  'the lint rules file is JSON, though it names no extension',
  displayModesFor('/.sasjslint').length === 3
)
check(
  'a SAS program keeps the editor alone',
  displayModesFor('/a/run.sas').length === 0
)
check(
  'a JS program keeps the editor alone',
  displayModesFor('/a/run.js').length === 0
)
check(
  'an image keeps the editor alone',
  displayModesFor('/a/logo.png').length === 0
)
check(
  'the modes are source, split, rendered',
  DISPLAY_MODES.join(',') === 'source,split,rendered'
)

check('the source label', displayModeLabel('source', '/a/x.md') === 'Source')
check('the split label', displayModeLabel('split', '/a/x.md') === 'Split')
check(
  'markdown previews',
  displayModeLabel('rendered', '/a/x.md') === 'Preview'
)
check('csv is a table', displayModeLabel('rendered', '/a/x.csv') === 'Table')
check('json is a tree', displayModeLabel('rendered', '/a/x.json') === 'Tree')
check(
  'and so is the lint file',
  displayModeLabel('rendered', '/.sasjslint') === 'Tree'
)

check(
  'the stored key is per kind, not per file',
  displayModeStorageKey('/a/orders.csv') === 'studio.displayMode.csv' &&
    displayModeStorageKey('/b/people.csv') === 'studio.displayMode.csv'
)
check(
  'the lint file stores under json',
  displayModeStorageKey('/.sasjslint') === 'studio.displayMode.json'
)

check('the kind of a markdown file', displayKindOf('/a/x.md') === 'markdown')
check('the kind of the lint file', displayKindOf('/.sasjslint') === 'json')
check('the kind of a program is none', displayKindOf('/a/x.sas') === null)

const storageOf = (value) => ({ getItem: () => value })

check(
  'nothing stored means the source',
  storedDisplayMode('/a/x.csv', storageOf(null)) === 'source'
)
check(
  'a stored mode is honoured',
  storedDisplayMode('/a/x.csv', storageOf('rendered')) === 'rendered'
)
check(
  'a stored mode that is not offered is ignored',
  storedDisplayMode('/a/x.csv', storageOf('tree')) === 'source'
)
check(
  'a kind with no modes is always the source',
  storedDisplayMode('/a/run.sas', storageOf('rendered')) === 'source'
)

// A page that refuses storage throws on the property ACCESS, not only on the call,
// so the lookup has to be guarded rather than defaulted.
const throwingStorage = {
  getItem() {
    throw new Error('SecurityError')
  }
}
check(
  'a storage that refuses reads still opens on the source',
  storedDisplayMode('/a/x.csv', throwingStorage) === 'source'
)
check(
  'a storage whose access throws still opens on the source',
  storedDisplayMode('/a/x.csv', {
    get getItem() {
      throw new Error('SecurityError')
    }
  }) === 'source'
)

// --- markdown --------------------------------------------------------------

const html = markdownToHtml(
  '# Title\n\nSome **bold** and `code`.\n\n```\ndata x; run;\n```\n\n- one\n- two\n\n[ok](https://example.com)\n[bad](javascript:alert(1))\n'
)

check('a heading renders', html.includes('<h1>Title</h1>'))
check('bold renders', html.includes('<strong>bold</strong>'))
check('inline code renders', html.includes('<code>code</code>'))
check(
  'a fence renders as pre/code',
  html.includes('<pre><code>data x; run;</code></pre>')
)
check('list items render', html.includes('<ul><li>one</li><li>two</li></ul>'))
check(
  'a safe link becomes an anchor',
  html.includes('<a href="https://example.com"')
)
check(
  'a javascript: link is left as text',
  !html.includes('javascript:alert(1)"') && html.includes('bad')
)
check(
  'markup in the file is escaped, not run',
  markdownToHtml('<script>alert(1)</script>').includes('&lt;script&gt;')
)
check(
  'an image stays the text it was written as',
  markdownToHtml('![shot](https://e.com/a.png)').includes(
    '![shot](https://e.com/a.png)'
  ) && !markdownToHtml('![shot](https://e.com/a.png)').includes('<a href')
)
check(
  'an unclosed fence still shows its body',
  markdownToHtml('```\nabc').includes('abc')
)
check(
  'an ordered list is ol',
  markdownToHtml('1. first\n2. second').includes('<ol>')
)

check('https is a safe href', isSafeHref('https://example.com'))
check('mailto is a safe href', isSafeHref('mailto:a@b.c'))
check('an anchor is a safe href', isSafeHref('#top'))
check('a relative path is a safe href', isSafeHref('./doc.md'))
check('javascript: is not', !isSafeHref('javascript:alert(1)'))
check('data: is not', !isSafeHref('data:text/html,<b>x</b>'))

// --- csv -------------------------------------------------------------------

const rows = parseCsv('a,b\n1,"two, with comma"\n3,"a ""quote"""\n')
check('plain cells', rows[0].join('|') === 'a|b')
check('a quoted comma stays in its cell', rows[1][1] === 'two, with comma')
check('doubled quotes become one', rows[2][1] === 'a "quote"')

check(
  'a newline inside quotes stays in the cell',
  parseCsv('a,b\n"line one\nline two",x\n')[1][0] === 'line one\nline two'
)
check(
  'a space before a quote does not split the row',
  // the quoted field loses the space that preceded its quote; the space before
  // the last, unquoted field is part of that value
  JSON.stringify(parseCsv('a, "b,c", d')) ===
    JSON.stringify([['a', 'b,c', ' d']])
)
check('CRLF is one line ending', parseCsv('a,b\r\n1,2\r\n').length === 2)
check(
  'no trailing newline still yields the last row',
  parseCsv('a,b\n1,2').length === 2
)
check(
  'a BOM does not become part of the first cell',
  parseCsv('\ufeffa,b\n').at(0)[0] === 'a'
)
check(
  'an apostrophe is not a quote',
  parseCsv("a\nO'Brien\n")[1][0] === "O'Brien"
)

const table = csvTable('name,age\nann,30\nbob,40\n')
check('the first row is the header', table.header.join('|') === 'name|age')
check(
  'the rows follow it',
  table.rows.length === 2 && table.rows[1][1] === '40'
)
check("the column count is the header's", table.columns === 2)
check(
  'nothing is truncated',
  table.truncated === false && table.rows.length === 2
)

const many = ['h']
  .concat(Array.from({ length: 5 }, (_, i) => String(i)))
  .join('\n')
const capped = csvTable(many, 3)
check('the cap keeps the rows asked for', capped.rows.length === 3)
check(
  'and says the file is longer',
  capped.rows.length === 3 && capped.truncated === true
)
check('the default cap is the constant', MAX_PREVIEW_ROWS === 200)
check('an empty file is an empty table', csvTable('').columns === 0)

// --- json ------------------------------------------------------------------

const tree = jsonTreeOf('{"a": 1, "b": [true, null], "c": {"d": "x"}}')
check(
  'the root is an object',
  tree.root.kind === 'object' && tree.root.summary === '3 keys'
)
check(
  'keys keep their order and labels',
  tree.root.children.map((n) => n.label).join(',') === 'a,b,c'
)
check('a leaf carries its value', tree.root.children[0].value === '1')
check('an array counts its items', tree.root.children[1].summary === '2 items')
check(
  'a nested key has a path',
  tree.root.children[2].children[0].path === '/c/d'
)
check(
  'a string leaf is quoted',
  tree.root.children[2].children[0].value === '"x"'
)

const broken = jsonTreeOf('{not json')
check(
  'an unparseable document says why',
  broken.root === null && typeof broken.error === 'string'
)
check(
  'an empty document is neither',
  jsonTreeOf('  ').root === null && jsonTreeOf('  ').error === null
)

// ---- which Monaco language a file is handed to -----------------------------

check(
  'a .sas file is SAS',
  languageForFile('/home/me/run.sas', 'sas') === 'sas'
)
check('a .json file is JSON', languageForFile('/a/b.json', 'json') === 'json')
check(
  'the rules dotfile is JSON too, though it names no extension',
  languageForFile('/sasjs/drive/files/.sasjslint', '') === 'json'
)
check(
  'and so is a copy of it anywhere else on the drive',
  languageForFile('/home/me/.sasjslint', '') === 'json'
)
check(
  'an unknown extension stays plain text',
  languageForFile('/a/blob.weird', 'weird') === 'plaintext'
)
check(
  'a dotless name called sasjslint is not the rules file',
  languageForFile('/a/sasjslint', '') === 'plaintext'
)

// ---- the JSON format action ------------------------------------------------

const minified = '{"a":1,"b":[1,2],"c":{"d":true}}'
const tidy = formatJson(minified)
check(
  'a minified document is indented',
  tidy.ok &&
    tidy.text ===
      [
        '{',
        '  "a": 1,',
        '  "b": [',
        '    1,',
        '    2',
        '  ],',
        '  "c": {',
        '    "d": true',
        '  }',
        '}',
        ''
      ].join('\n')
)

const again = formatJson(tidy.text)
check(
  'a tidy document is left exactly as it is',
  again.ok && again.text === tidy.text
)
check(
  'four spaces are rewritten to the house indent',
  formatJson('{\n    "a": 1\n}\n').ok &&
    formatJson('{\n    "a": 1\n}\n').text === '{\n  "a": 1\n}'.concat('\n')
)
check(
  "key order is the file's order",
  formatJson('{"b":1,"a":2}').text.indexOf('"b"') <
    formatJson('{"b":1,"a":2}').text.indexOf('"a"')
)

const invalidJson = formatJson('{"a": 1,}')
check(
  'a syntax error is reported rather than guessed at',
  invalidJson.ok === false
)
check(
  'and the reason travels with it',
  invalidJson.ok === false && /JSON|token|position/i.test(invalidJson.error)
)
check(
  'an empty document stays empty',
  formatJson('   ').ok && formatJson('   ').text === '   '
)
check(
  'a value that is not an object formats too',
  formatJson('[1,2]').text === '[\n  1,\n  2\n]\n'
)

if (failures.length) {
  console.error(`display modes: ${failures.length} check(s) failed`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('display modes: all checks passed')
