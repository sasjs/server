/**
 * Asserts the rules a folder search uses to read the files it searches.
 *
 * Three questions, each of which is a wrong answer waiting to happen: which files
 * is it worth asking the server for, where in a file did the query match, and how
 * much of a folder does one search read. All three are pure functions of a path,
 * a body and a cap, so they are asserted here rather than through a rendered box -
 * the wiring is in `test-search-browser.mjs`.
 *
 * The caps are the part that matters most. A search that reads the first two
 * hundred files of a folder and says nothing is a search that answers "the word is
 * not in there" about four hundred files it never opened, so the counts it reports
 * are asserted to be right rather than merely non-zero.
 *
 * Run with `npm run test:content-search`.
 */
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const {
  MAX_CONTENT_BYTES,
  MAX_CONTENT_FILES,
  MAX_SCAN_TEXT,
  READ_CONCURRENCY,
  SNIPPET_LENGTH,
  isSearchableText,
  readContents,
  snippetIn
} = await import('../src/utils/contentSearch.ts')

let checks = 0
const check = (label, fn) => {
  fn()
  checks += 1
}

// --- which files a folder search reads ---------------------------------------

// the formats a program on a drive is written in: asked for
for (const filePath of [
  '/demo/services/orders.sas',
  '/demo/README.md',
  '/demo/sasjsconfig.json',
  '/demo/app/index.html',
  '/demo/style.css',
  '/demo/run.py',
  '/demo/notes.txt',
  '/demo/orders.log'
])
  check(`a text file is read: ${filePath}`, () =>
    assert.equal(isSearchableText(filePath), true, filePath)
  )

// `.sasjslint` is a dotfile - its "extension" is nothing - and the drive's own
// rules file is still config, which is what the tree already calls it
check('the drive rules file is read', () =>
  assert.equal(isSearchableText('/demo/.sasjslint'), true)
)

// the bytes a search cannot read, or should not: a picture, a dataset, a
// spreadsheet, a document, an archive - and a name with no extension at all,
// which may be anything
for (const filePath of [
  '/demo/logo.png',
  '/demo/data.sas7bdat',
  '/demo/export.xlsx',
  '/demo/report.pdf',
  '/demo/archive.zip',
  '/demo/mystery'
])
  check(`a file that is not text is not read: ${filePath}`, () =>
    assert.equal(isSearchableText(filePath), false, filePath)
  )

// A table is text and is deliberately out: a `.csv` on a drive is the one text
// format that runs to megabytes, and reading it to answer "which file mentions
// orders" costs more than the answer is worth
check('a table is not read', () =>
  assert.equal(isSearchableText('/demo/orders.csv'), false)
)

// --- where in a file a query matched -----------------------------------------

check('the line of a match, counted from one', () =>
  assert.deepEqual(snippetIn('a\nb\norders\nc', 'orders'), {
    line: 3,
    text: 'orders'
  })
)

check('a match is case-insensitive, and keeps the file case', () =>
  assert.equal(snippetIn('Orders here', 'orders')?.text, 'Orders here')
)

check('the query is trimmed before it is searched for', () =>
  assert.equal(snippetIn('x\n  orders  ', '  orders  ')?.line, 2)
)

check('the first match wins, not the last', () =>
  assert.equal(snippetIn('orders\norders', 'orders')?.line, 1)
)

check('indentation is dropped, so the matched word is not pushed out', () =>
  assert.equal(
    snippetIn('      %let orders = 1;', 'orders')?.text,
    '%let orders = 1;'
  )
)

check('a CRLF file is split on its own line ending', () =>
  assert.deepEqual(snippetIn('a\r\norders\r\nb', 'orders'), {
    line: 2,
    text: 'orders'
  })
)

check('a file that does not mention the query has no snippet', () =>
  assert.equal(snippetIn('nothing here', 'orders'), null)
)

// one character asks nothing, as in every other search in the box
check('a one character query matches nothing', () =>
  assert.equal(snippetIn('orders', 'o'), null)
)

// A generated line can be hundreds of columns wide and the match can be at
// column 300: the window is cut around the match rather than at the line's end,
// and the cut is marked on both sides
const long = `${'x'.repeat(400)} orders ${'y'.repeat(400)}`
const clipped = snippetIn(long, 'orders')

check('a long line is cut to the window', () =>
  assert.equal(clipped.text.length, SNIPPET_LENGTH + 2)
)
check('the match survives the cut', () =>
  assert.ok(clipped.text.includes('orders'), clipped.text)
)
check('a cut is marked at both ends', () =>
  assert.ok(clipped.text.startsWith('…') && clipped.text.endsWith('…'))
)

// a match near the start keeps the beginning of the line rather than pointing
// past it
const early = snippetIn(`orders ${'z'.repeat(400)}`, 'orders')
check('an early match starts at the beginning', () =>
  assert.ok(early.text.startsWith('orders'), early.text)
)

// --- how much of a folder one search reads -----------------------------------

const readAll = async (files, text = (filePath) => `body of ${filePath}`) =>
  readContents(files, async (filePath) => text(filePath))

await (async () => {
  const seeded = await readAll(['/a.sas', '/b.md', '/c.png', '/d.csv'])
  check('only the readable files are asked for', () =>
    assert.deepEqual(
      seeded.contents.map((file) => file.path),
      ['/a.sas', '/b.md']
    )
  )
  check('an unreadable format is not counted as a refusal', () =>
    assert.equal(seeded.unreadable, 0)
  )

  const order = await readAll(['/z.sas', '/a.sas', '/m.sas'])
  check('bodies are kept in path order, not answer order', () =>
    assert.deepEqual(
      order.contents.map((file) => file.path),
      ['/a.sas', '/m.sas', '/z.sas']
    )
  )

  const refused = await readContents(['/a.sas', '/b.sas'], async (filePath) =>
    filePath === '/b.sas' ? null : 'text'
  )
  check('a refusal ends that file, not the folder', () =>
    assert.equal(refused.contents.length, 1)
  )
  check('a refusal is counted, so the box can say so', () =>
    assert.equal(refused.unreadable, 1)
  )

  const thrown = await readContents(['/a.sas', '/b.sas'], async (filePath) => {
    if (filePath === '/b.sas') throw new Error('gone')
    return 'text'
  })
  check('a file that throws is counted rather than thrown', () =>
    assert.deepEqual([thrown.contents.length, thrown.unreadable], [1, 1])
  )

  // the cap: two hundred files read, the rest counted as skipped - which is what
  // lets the box say "read the first 200 of N"
  const many = Array.from(
    { length: MAX_CONTENT_FILES + 17 },
    (_, index) => `/many/file${index}.sas`
  )
  const capped = await readAll(many)
  check('the file cap is the cap', () =>
    assert.equal(capped.contents.length, MAX_CONTENT_FILES)
  )
  check('the files the cap left out are counted', () =>
    assert.equal(capped.skipped, 17)
  )
  check('and the folder knows how many it held', () =>
    assert.equal(capped.readable, MAX_CONTENT_FILES + 17)
  )
  check('the file cap is reported as the reason', () =>
    assert.equal(capped.stopped, 'files')
  )

  // The text budget: what a scan keeps outlives the query, so a folder of big
  // logs is read up to what a tab should hold and no further. The files it did
  // not reach are counted, and the box can say which cap ran out.
  const logs = Array.from({ length: 40 }, (_, index) => `/logs/log${index}.log`)
  const big = await readContents(logs, async () => 'x'.repeat(300 * 1024))
  check('a folder over the text budget stops reading', () => {
    assert.equal(big.stopped, 'text')
    assert.ok(big.skipped > 0, 'files were left unread')
    assert.ok(big.contents.length < logs.length, 'and not all of them were read')
  })
  check('what a scan keeps is bounded by the budget', () => {
    const held = big.contents.reduce((total, file) => total + file.text.length, 0)

    // the workers already in flight finish, so the bound is the budget plus one
    // body per worker rather than the budget exactly
    assert.ok(
      held <= MAX_SCAN_TEXT + READ_CONCURRENCY * MAX_CONTENT_BYTES,
      `${held} characters held`
    )
  })

  // A file longer than the cap keeps its beginning and is counted as clipped, so
  // a match past 256 KB is reported as not looked for rather than as absent
  const long = `orders\n${'x'.repeat(MAX_CONTENT_BYTES)}`
  const trimmed = await readContents(['/long.log'], async () => long)
  check('a long file is cut at the byte cap', () =>
    assert.equal(trimmed.contents[0].text.length, MAX_CONTENT_BYTES)
  )
  check('a long file is counted as clipped', () =>
    assert.equal(trimmed.clipped, 1)
  )

  // progress walks up to the total without passing it, which is the text the box
  // shows while a folder is being read
  const seen = []
  await readContents(
    ['/a.sas', '/b.sas', '/c.sas'],
    async () => 'x',
    (done, total) => seen.push(`${done}/${total}`)
  )
  check('progress reaches the total once', () =>
    assert.deepEqual(seen.sort(), ['1/3', '2/3', '3/3'])
  )

  // a few files at a time, as the walk reads folders: a folder search must not
  // open a connection per file
  let inFlight = 0
  let most = 0
  await readContents(
    Array.from({ length: 12 }, (_, index) => `/f${index}.sas`),
    async () => {
      inFlight += 1
      most = Math.max(most, inFlight)
      await new Promise((resolve) => setTimeout(resolve, 1))
      inFlight -= 1

      return 'x'
    }
  )
  check('the scan is not one request at a time', () =>
    assert.ok(most > 1, `read ${most} files at once`)
  )
  check('the scan is bounded', () =>
    assert.ok(most <= 6, `read ${most} at once`)
  )

  // a malformed limit must not stall the scan or launch a request per file
  const clamped = await readContents(
    ['/a.sas', '/b.sas'],
    async () => 'x',
    undefined,
    0
  )
  check('a zero concurrency still reads every file', () =>
    assert.equal(clamped.contents.length, 2)
  )

  // The cap is stated in KB and a body is measured in bytes. A file of accented
  // text is two bytes per character, so 150 000 characters is 300 KB and is over
  // the cap - while its `length` says it is under it. Measuring code units would
  // search three times what the reader was promised and never report the cut.
  const accented = 'é'.repeat(150000)
  assert.ok(accented.length < MAX_CONTENT_BYTES, 'the fixture is under the cap by length')
  const measured = await readContents(['/accented.txt'], async () => accented)
  check('a multi-byte body is measured in bytes, not code units', () =>
    assert.equal(measured.clipped, 1)
  )
  check('what is kept fits the byte budget', () =>
    assert.ok(
      Buffer.byteLength(measured.contents[0].text, 'utf8') <= MAX_CONTENT_BYTES,
      `${Buffer.byteLength(measured.contents[0].text, 'utf8')} bytes kept`
    )
  )

  // a body under the cap in both senses is not touched at all
  const short = 'é'.repeat(100)
  const untouched = await readContents(['/short.txt'], async () => short)
  check('a body that fits is kept whole', () =>
    assert.deepEqual(
      [untouched.contents[0].text === short, untouched.clipped],
      [true, 0]
    )
  )

  // A cut lands between characters, not inside one: an emoji is two code units
  // and four bytes, and half of one is not text
  const emoji = '😀'.repeat(80000)
  const cutEmoji = await readContents(['/emoji.txt'], async () => emoji)
  check('a cut does not split a surrogate pair', () => {
    const kept = cutEmoji.contents[0].text

    assert.equal(Buffer.from(kept, 'utf8').toString('utf8'), kept)
    assert.equal(cutEmoji.clipped, 1)
  })
})()

console.log(`\n${checks} checks passed`)
