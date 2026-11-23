// Exercise the real FolderView in Chromium, with a level handed to it.
// Run: npm run test:folderview-browser (requires Chromium on PATH).
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import webpack from 'webpack'
import { waitForDevTools } from './browser-start.mjs'

const candidates = process.env.CHROMIUM
  ? [process.env.CHROMIUM]
  : ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable']
const executable = candidates.find(
  (candidate) => !spawnSync(candidate, ['--version'], { stdio: 'ignore' }).error
)
assert.ok(executable, 'Chromium not found; set CHROMIUM to its executable')
const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const temp = await mkdtemp(path.join(tmpdir(), 'sasjs-folder-test-'))
let server, browser, socket
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

try {
  const compiler = webpack({
    mode: 'development',
    devtool: false,
    context: web,
    entry: './scripts/fixtures/folder-view-browser.tsx',
    output: { path: temp, filename: 'bundle.js' },
    resolve: { extensions: ['.tsx', '.ts', '.js', '.jsx'] },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                compilerOptions: { noEmit: false }
              }
            }
          ]
        }
      ]
    }
  })

  await new Promise((resolve, reject) =>
    compiler.run((error, stats) => {
      if (error) return reject(error)
      if (stats.hasErrors())
        return reject(new Error(stats.toString({ all: false, errors: true })))
      resolve()
    })
  )
  await new Promise((resolve) => compiler.close(resolve))

  server = createServer(async (req, res) => {
    if (req.url === '/bundle.js') {
      res.setHeader('content-type', 'application/javascript')
      res.end(await readFile(path.join(temp, 'bundle.js')))
    } else {
      res.setHeader('content-type', 'text/html; charset=utf-8')
      res.end(
        '<!doctype html><html><body><div id="root"></div><script src="/bundle.js"></script></body></html>'
      )
    }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))

  browser = spawn(
    executable,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--remote-debugging-port=0',
      `--user-data-dir=${temp}/profile`,
      'about:blank'
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] }
  )

  const port = await waitForDevTools(browser)
  const pageTarget = async () => {
    for (let attempt = 0; attempt < 100; attempt++) {
      const targets = await (
        await fetch(`http://127.0.0.1:${port}/json`)
      ).json()
      const page = targets.find((target) => target.type === 'page')
      if (page) return page
      await pause(100)
    }
    throw new Error('the DevTools endpoint served no page target')
  }

  socket = new WebSocket((await pageTarget()).webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.onopen = resolve
    socket.onerror = reject
  })

  let nextId = 0
  const pending = new Map()
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data)
    if (pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id)
      pending.delete(message.id)
      message.error
        ? reject(new Error(message.error.message))
        : resolve(message.result)
    }
  }
  const call = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId
      pending.set(id, { resolve, reject })
      socket.send(JSON.stringify({ id, method, params }))
    })
  const evaluate = async (expression) => {
    const result = await call('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    })
    if (result.exceptionDetails)
      throw new Error(
        result.exceptionDetails.text +
          ': ' +
          result.exceptionDetails.exception?.description
      )
    return result.result.value
  }
  const until = async (expression, label) => {
    for (let n = 0; n < 100; n++) {
      if (await evaluate(expression)) return
      await pause(50)
    }
    throw new Error(
      `Timed out: ${label}; DOM: ${await evaluate('document.body.innerText')}`
    )
  }
  const rows = () =>
    evaluate(
      '[...document.querySelectorAll("tbody tr")].map((row) => [...row.querySelectorAll("td")].map((cell) => cell.innerText.trim()))'
    )
  const headers = () =>
    evaluate(
      '[...document.querySelectorAll("thead th")].map((th) => th.innerText.trim())'
    )

  await call('Emulation.setDeviceMetricsOverride', {
    width: 1200,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  })
  await call('Page.navigate', {
    url: `http://127.0.0.1:${server.address().port}/`
  })
  await until(
    '!!window.folderHarness && !!document.querySelector("table")',
    'mount'
  )

  // --- where the reader is ----------------------------------------------------

  assert.ok(
    await evaluate('document.body.innerText.includes("files")'),
    'the drive crumb'
  )
  assert.ok(
    await evaluate('document.body.innerText.includes("Public")'),
    'a crumb segment'
  )
  assert.ok(
    await evaluate('document.body.innerText.includes("demo")'),
    'the folder itself'
  )
  await evaluate(
    `[...document.querySelectorAll('button')].find((el) => el.textContent.trim() === 'Public').click()`
  )
  assert.deepEqual(
    await evaluate('folderHarness.calls'),
    ['folder:/Public'],
    'a crumb goes to the folder it names'
  )

  // --- the summary ------------------------------------------------------------

  await until(
    'document.body.innerText.includes("2 files") && document.body.innerText.includes("1 folder")',
    'the counts'
  )
  assert.ok(
    await evaluate('document.body.innerText.includes("last change")'),
    'the newest change is part of the summary'
  )
  // no size in the tree, so no total and no Size column - not "0 B"
  assert.equal(
    await evaluate('document.body.innerText.includes("0 B")'),
    false,
    'a missing size is not reported as zero'
  )
  assert.deepEqual(
    await headers(),
    ['Name', 'Created', 'Modified'],
    'no Size column without sizes'
  )

  // --- the listing ------------------------------------------------------------

  // folders first, whatever order the level came in
  assert.deepEqual(
    (await rows()).map((row) => row[0]),
    ['macro', 'orders.sas', 'run.sas'],
    'folders first, then files by name'
  )
  assert.ok(
    (await rows())[1][1].length > 0,
    'a file row carries its created date'
  )
  assert.ok(
    (await rows())[0][1] === '',
    'a folder carries no dates, and the cell says nothing rather than a dash'
  )

  await evaluate(
    `[...document.querySelectorAll('tbody tr')].find((row) => row.innerText.includes('run.sas')).click()`
  )
  assert.deepEqual(
    (await evaluate('folderHarness.calls')).at(-1),
    'file:/Public/demo/run.sas',
    'a file row opens the file'
  )
  await evaluate(
    `[...document.querySelectorAll('tbody tr')].find((row) => row.innerText.includes('macro')).click()`
  )
  assert.deepEqual(
    (await evaluate('folderHarness.calls')).at(-1),
    'folder:/Public/demo/macro',
    'a folder row goes to the folder'
  )

  // --- one box, and the listing gives way to it --------------------------------

  // A second box that only narrowed this level's listing was a weaker duplicate of
  // the search, and the two could not be combined. The page has one box.
  assert.equal(
    await evaluate('document.querySelectorAll("input").length'),
    1,
    'the page has a single search box'
  )

  // --- the folder's own search -------------------------------------------------

  // The page carries the search box, not the header: the reader has opened THIS
  // folder, and the box searches its file names and the text inside them.
  const field = 'input[aria-label="Search folders and files in demo"]'
  assert.equal(
    await evaluate(`!!document.querySelector(${JSON.stringify(field)})`),
    true,
    'the page carries a search box'
  )
  // One trimmed character neither hides the listing nor starts a walk.
  await evaluate(`document.querySelector(${JSON.stringify(field)}).focus()`)
  await call('Input.insertText', { text: ' m' })
  await pause(150)
  assert.equal(await evaluate('!!document.querySelector("table")'), true)
  assert.equal((await evaluate('folderHarness.requests')).length, 0)
  await evaluate(
    `(() => { const input = document.querySelector('input'); input.focus(); input.select() })()`
  )
  await call('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Backspace',
    code: 'Backspace',
    windowsVirtualKeyCode: 8
  })
  await call('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Backspace',
    code: 'Backspace',
    windowsVirtualKeyCode: 8
  })
  await evaluate(`document.querySelector(${JSON.stringify(field)}).focus()`)
  await call('Input.insertText', { text: 'orders' })
  await until(
    'document.body.textContent.includes("line 2: %include")',
    'a body hit with its line'
  )
  // the search covers the folders under this one, so the level's own listing stands
  // down while a query is being answered - two sets of rows under one box would be
  // ambiguous about which one the box was talking to
  assert.equal(
    await evaluate('!!document.querySelector("table")'),
    false,
    'the listing gives way to the results'
  )
  assert.equal(
    await evaluate('document.querySelector("input").value'),
    'orders',
    'the one box holds the query'
  )

  const resultRows = () =>
    evaluate(
      '[...document.querySelectorAll("[role=button]")].map((row) => row.innerText).filter((text) => text.includes("\\n"))'
    )
  const rowsShown = await resultRows()
  assert.ok(
    rowsShown.some((row) => row.includes('orders.sas') && row.includes('File')),
    'the file named for the query is a hit'
  )
  assert.ok(
    rowsShown.some((row) => row.includes('run.sas') && row.includes('line 2:')),
    'and the file that says it is a hit, with its line'
  )

  // the walk covered the folder that was opened, and the read was its text files
  const asked = await evaluate('folderHarness.requests')
  assert.deepEqual(
    asked.filter((request) => request.startsWith('fileTree:')).sort(),
    ['fileTree:/Public/demo', 'fileTree:/Public/demo/macro'],
    'this folder and the folders under it were walked, and nothing above them'
  )
  assert.deepEqual(
    asked.filter((request) => request.startsWith('file:')).sort(),
    ['file:/Public/demo/orders.sas', 'file:/Public/demo/run.sas'],
    'only its text files were read'
  )

  // choosing the body hit opens that file in the editor
  await evaluate(
    `[...document.querySelectorAll('[role=button]')].find((row) => row.innerText.includes('line 2:')).click()`
  )
  assert.deepEqual(
    (await evaluate('folderHarness.calls')).at(-1),
    'file:/Public/demo/run.sas',
    'a body hit opens the file it was found in'
  )
  // clearing the box puts the listing back: the level the reader was looking at is
  // still what the page is about when nothing is being asked
  await evaluate(
    `(() => { const field = document.querySelector("input"); field.focus(); field.select() })()`
  )
  await call('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Backspace',
    code: 'Backspace',
    windowsVirtualKeyCode: 8
  })
  await call('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Backspace',
    code: 'Backspace',
    windowsVirtualKeyCode: 8
  })
  await until('!!document.querySelector("table")', 'the listing returns')

  // Empty subfolders are discoverable and openable from the search results.
  await evaluate(`document.querySelector(${JSON.stringify(field)}).focus()`)
  await call('Input.insertText', { text: 'macro' })
  await until(
    `[...document.querySelectorAll('[role=button]')].some(el => el.innerText.includes('macro') && el.innerText.includes('Folder'))`,
    'empty folder search result'
  )
  await evaluate(
    `[...document.querySelectorAll('[role=button]')].find(el => el.innerText.includes('macro') && el.innerText.includes('Folder')).click()`
  )
  assert.equal(
    (await evaluate('folderHarness.calls')).at(-1),
    'folder:/Public/demo/macro'
  )
  await evaluate(
    `(() => { const input = document.querySelector('input'); input.focus(); input.select() })()`
  )
  await call('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Backspace',
    code: 'Backspace',
    windowsVirtualKeyCode: 8
  })
  await call('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Backspace',
    code: 'Backspace',
    windowsVirtualKeyCode: 8
  })
  await until(
    '!!document.querySelector("table")',
    'listing after folder search'
  )

  // Every matching result is reachable, including those after the header's cap.
  await evaluate('folderHarness.setPath("/many")')
  await until(
    `!!document.querySelector('input[aria-label="Search folders and files in many"]')`,
    'many folder'
  )
  await pause(100)
  await evaluate(
    `document.querySelector('input[aria-label="Search folders and files in many"]').focus()`
  )
  await call('Input.insertText', { text: 'match' })
  await until(
    'document.body.innerText.includes("match00.bin")',
    'many search ready'
  )
  assert.equal(
    await evaluate(
      `[...document.querySelectorAll('[role=button]')].filter(el => /match\\d\\d\\.bin/.test(el.innerText)).length`
    ),
    12,
    'only the first 12 matches are initially rendered'
  )
  assert.ok(
    await evaluate(
      'document.body.innerText.includes("Showing 12 of 20 results")'
    )
  )
  await evaluate(
    `[...document.querySelectorAll('button')].find(el => el.textContent.trim() === 'Show more').click()`
  )
  await until(
    'document.body.innerText.includes("Showing 20 of 20 results")',
    'all results shown'
  )
  assert.equal(
    await evaluate(
      `[...document.querySelectorAll('[role=button]')].filter(el => /match\\d\\d\\.bin/.test(el.innerText)).length`
    ),
    20,
    'all 20 matches are accessible after showing more'
  )
  assert.equal(
    await evaluate(
      `[...document.querySelectorAll('button')].some(el => el.textContent.trim() === 'Show more')`
    ),
    false,
    'show more is gone when all results are visible'
  )
  await evaluate(
    `[...document.querySelectorAll('[role=button]')].find(el => el.innerText.includes('match19.bin')).click()`
  )
  assert.equal(
    (await evaluate('folderHarness.calls')).at(-1),
    'file:/many/match19.bin'
  )
  // Changing a query resets the visible batch even when it matches the same files.
  await evaluate(
    `(() => { const input = document.querySelector('input'); input.focus(); input.select() })()`
  )
  await call('Input.insertText', { text: 'MATCH' })
  await until(
    'document.body.innerText.includes("Showing 12 of 20 results")',
    'query resets the batch'
  )
  await evaluate(
    `[...document.querySelectorAll('button')].find(el => el.textContent.trim() === 'Show more').click()`
  )
  await until(
    'document.body.innerText.includes("Showing 20 of 20 results")',
    'expand before navigation'
  )
  // Type in the destination's layout phase: the reset must not depend on effects.
  await evaluate(
    'folderHarness.typeDuringNextPath("match"); folderHarness.setPath("/many2")'
  )
  await until(
    'document.body.innerText.includes("Showing 12 of 20 results")',
    'folder resets the batch'
  )
  assert.equal(
    await evaluate(
      `[...document.querySelectorAll('[role=button]')].filter(el => /match\\d\\d\\.bin/.test(el.innerText)).length`
    ),
    12,
    'the new folder starts at the first batch'
  )
  // Each click adds a bounded batch, including a partial final batch.
  await evaluate(
    'folderHarness.typeDuringNextPath("match"); folderHarness.setPath("/many3")'
  )
  await until(
    'document.body.innerText.includes("Showing 12 of 37 results")',
    'large result count'
  )
  const pressKey = async (key, code, windowsVirtualKeyCode) => {
    for (const type of ['keyDown', 'keyUp'])
      await call('Input.dispatchKeyEvent', { type, key, code, windowsVirtualKeyCode })
  }
  for (const [shown, first, key, code, keyCode] of [
    [24, 'match12.bin', 'Enter', 'Enter', 13],
    [36, 'match24.bin', ' ', 'Space', 32],
    [37, 'match36.bin', 'Enter', 'Enter', 13]
  ]) {
    await evaluate(
      `[...document.querySelectorAll('button')].find(el => el.textContent.trim() === 'Show more').focus()`
    )
    assert.equal(await evaluate(`document.activeElement?.textContent.trim()`), 'Show more', 'show more receives focus')
    await pressKey(key, code, keyCode)
    await until(
      `document.body.innerText.includes("Showing ${shown} of 37 results")`,
      `batch ${shown}`
    )
    assert.equal(
      await evaluate(
        `[...document.querySelectorAll('[role=button]')].filter(el => /match\\d\\d\\.bin/.test(el.innerText)).length`
      ),
      shown
    )
    assert.ok(
      await evaluate(`document.activeElement?.innerText.includes(${JSON.stringify(first)})`),
      `focus moves to ${first}, the first newly revealed result`
    )
    assert.equal(await evaluate(`document.activeElement?.getAttribute('role')`), 'button',
      'the focused result has button semantics')
    if (shown === 24) {
      await pressKey('Tab', 'Tab', 9)
      assert.ok(await evaluate(`document.activeElement?.innerText.includes('match13.bin')`),
        'Tab proceeds through newly revealed results')
    }
  }
  await pressKey('Enter', 'Enter', 13)
  assert.equal(
    (await evaluate('folderHarness.calls')).at(-1),
    'file:/many3/match36.bin'
  )
  await evaluate('folderHarness.setPath("/Public/demo")')
  await until('!!document.querySelector("table")', 'return to demo')

  console.log('folder view: the search box is on the folder itself')

  // --- a host that reports sizes ----------------------------------------------

  await evaluate('folderHarness.setSizes(true)')
  await until('!!document.querySelector("thead th")', 'the level again')
  await until(
    'document.body.innerText.includes("3 KB")',
    'the total of the sized files'
  )
  assert.deepEqual(
    await headers(),
    ['Name', 'Size', 'Created', 'Modified'],
    'the Size column appears when the host reports sizes'
  )
  assert.equal((await rows())[0][1], '', 'a folder has no size of its own')
  assert.equal((await rows())[1][1], '2 KB', 'a file shows its size')

  console.log('folder view: sizes are shown when the tree carries them')

  // --- an unread level is not an empty folder ----------------------------------

  // The tree holds a node for a level it has not fetched, and `childrenOf` answers
  // a loading placeholder for it: a page that read that as "no children" would tell
  // the reader the folder is empty before anything had been asked.
  await call('Page.navigate', {
    url: `http://127.0.0.1:${server.address().port}/`
  })
  await until(
    '!!window.folderHarness && !!document.querySelector("table")',
    'mount again'
  )
  await evaluate('folderHarness.setUnread(true)')
  await until(
    'document.body.innerText.includes("Reading this folder…")',
    'an unread level says it is being read'
  )
  assert.equal(
    await evaluate('document.body.innerText.includes("This folder is empty.")'),
    false,
    'an unread level is not reported as empty'
  )
  await evaluate('folderHarness.setUnread(false)')
  await until(
    'document.body.innerText.includes("2 files")',
    'the level read again'
  )

  // --- a scan started on one folder does not answer for another ----------------

  // Open a folder, start its scan, then move to another before it settles: the
  // first folder's matches must not appear under the second one's heading.
  await call('Page.navigate', {
    url: `http://127.0.0.1:${server.address().port}/`
  })
  await until(
    '!!window.folderHarness && !!document.querySelector("table")',
    'mount once more'
  )
  await evaluate('folderHarness.setHold(true)')
  await evaluate(
    `document.querySelector('input[aria-label="Search folders and files in demo"]').focus()`
  )
  await call('Input.insertText', { text: 'orders' })
  await until(
    'folderHarness.requests.includes("fileTree:/Public/demo")',
    'the walk for the first folder is out'
  )
  await evaluate('folderHarness.setPath("/Public/macro")')
  const macroField = 'input[aria-label="Search folders and files in macro"]'
  await until(
    `!!document.querySelector(${JSON.stringify(macroField)})`,
    'the second folder page'
  )
  await pause(150)
  assert.equal(
    await evaluate('folderHarness.requests.includes("fileTree:/Public/macro")'),
    false,
    'navigation during a search must not start a scan of the destination'
  )
  await evaluate('folderHarness.setHold(false); folderHarness.release()')
  await pause(400)

  assert.equal(
    await evaluate('document.body.innerText.includes("line 2: %include")'),
    false,
    "the first folder's body hit does not surface under the second"
  )
  assert.equal(
    await evaluate('document.body.innerText.includes("run.sas")'),
    false,
    "nor does a file from the first folder's listing"
  )

  // The second folder answers for itself.
  await evaluate(
    `document.querySelector(${JSON.stringify(macroField)}).focus()`
  )
  // A word that is in the file's BODY and in neither its name nor its path: a word
  // in the name is already the stronger answer, and the dedupe keeps one row.
  await call('Input.insertText', { text: 'null' })
  await until(
    'document.body.innerText.includes("line 2: data _null_;")',
    'the second folder answers for itself'
  )
  console.log(
    'folder view: an unread level, and a scan that outlives its folder'
  )

  // A -> B -> A: the original A scan must not replace the new A scan, even
  // though both have the same path. Give the old response a distinct file name.
  await call('Page.navigate', {
    url: `http://127.0.0.1:${server.address().port}/`
  })
  await until(
    '!!window.folderHarness && !!document.querySelector("table")',
    'race mount'
  )
  await evaluate(
    'folderHarness.setStaleHeldTree(true); folderHarness.setHold(true)'
  )
  await evaluate('document.querySelector("input").focus()')
  await call('Input.insertText', { text: 'orders' })
  await until(
    'folderHarness.requests.includes("fileTree:/Public/demo")',
    'old scan held'
  )
  await evaluate('folderHarness.setPath("/Public/macro")')
  await until(
    `!!document.querySelector(${JSON.stringify(macroField)})`,
    'race folder B'
  )
  await evaluate(
    'folderHarness.setHold(false); folderHarness.setPath("/Public/demo")'
  )
  await until(
    `!!document.querySelector(${JSON.stringify(field)})`,
    'race folder A again'
  )
  await evaluate('document.querySelector("input").focus()')
  await call('Input.insertText', { text: 'orders' })
  await until(
    'document.body.textContent.includes("line 2: %include")',
    'new A scan finishes'
  )
  await evaluate('folderHarness.release()')
  await until(
    'folderHarness.completedHeldTree === 1',
    'old A response released'
  )
  await pause(300)
  assert.equal(
    await evaluate('document.body.textContent.includes("stale-orders.bin")'),
    false,
    'an old A response cannot overwrite the new A scan after A → B → A'
  )
  assert.equal(
    await evaluate('document.body.textContent.includes("line 2: %include")'),
    true
  )
  console.log('folder view: same-folder return keeps the new scan')

  // Simulate input in the destination's layout phase, before passive effects.
  await evaluate(
    'folderHarness.typeDuringNextPath("null"); folderHarness.setPath("/Public/macro")'
  )
  await until(
    `!!document.querySelector(${JSON.stringify(macroField)})`,
    'early typing destination'
  )
  await pause(100)
  assert.equal(
    await evaluate('document.querySelector("input").value'),
    'null',
    'navigation must not erase early destination typing'
  )
  await until(
    'document.body.textContent.includes("line 2: data _null_;")',
    'early typed query is searched'
  )
  console.log('folder view: early destination typing is retained')

  // A refused root is not an empty answer; clearing and trying again retries it.
  await call('Page.navigate', {
    url: `http://127.0.0.1:${server.address().port}/`
  })
  await until(
    '!!window.folderHarness && !!document.querySelector("table")',
    'refusal mount'
  )
  await evaluate('folderHarness.setRefusedFolders(["/Public/demo"])')
  await evaluate('document.querySelector("input").focus()')
  await call('Input.insertText', { text: 'orders' })
  await until(
    'document.body.innerText.includes("This folder could not be read.")',
    'refused root reported'
  )
  assert.equal(
    await evaluate(
      'document.body.innerText.includes("Nothing in this folder matches")'
    ),
    false
  )
  await evaluate(
    'folderHarness.setRefusedFolders([]); document.querySelector("input").select()'
  )
  await call('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Backspace',
    code: 'Backspace',
    windowsVirtualKeyCode: 8
  })
  await call('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Backspace',
    code: 'Backspace',
    windowsVirtualKeyCode: 8
  })
  await until('!!document.querySelector("table")', 'clear failed search')
  await call('Input.insertText', { text: 'orders' })
  await until(
    'document.body.textContent.includes("line 2: %include")',
    'retry after root refusal'
  )
  assert.equal(
    await evaluate(
      'folderHarness.requests.filter(r => r === "fileTree:/Public/demo").length'
    ),
    2
  )
  console.log('folder view: refused root is reported and retried')

  // A refused descendant leaves useful results, but the answer is incomplete even
  // when the readable branches contain no matches.
  await call('Page.navigate', {
    url: `http://127.0.0.1:${server.address().port}/`
  })
  await until(
    '!!window.folderHarness && !!document.querySelector("table")',
    'partial mount'
  )
  await evaluate('folderHarness.setRefusedFolders(["/Public/demo/macro"])')
  await evaluate('document.querySelector("input").focus()')
  await call('Input.insertText', { text: 'orders' })
  await until(
    'document.body.textContent.includes("line 2: %include")',
    'readable branch retained'
  )
  assert.ok(
    await evaluate(
      'document.body.innerText.includes("1 subfolder could not be read; results may be incomplete.")'
    ),
    'partial results must disclose the unreadable subtree'
  )
  await evaluate('document.querySelector("input").select()')
  await call('Input.insertText', { text: 'no-such-word' })
  await until(
    'document.body.innerText.includes("No matches found in the folders searched.")',
    'no matches in readable branches'
  )
  assert.equal(
    await evaluate(
      'document.body.innerText.includes("Nothing in this folder matches")'
    ),
    false
  )
  assert.ok(
    await evaluate(
      'document.body.innerText.includes("1 subfolder could not be read; results may be incomplete.")'
    ),
    'empty partial answer must disclose the unreadable subtree'
  )
  console.log('folder view: partial results disclose refused descendants')
} finally {
  socket?.close()
  browser?.kill()
  if (server) await new Promise((resolve) => server.close(resolve))
  await rm(temp, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 100
  })
}
