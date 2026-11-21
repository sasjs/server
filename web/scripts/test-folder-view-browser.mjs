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

  // --- the filter -------------------------------------------------------------

  await evaluate(
    `document.querySelector('input[aria-label="Filter the files in demo"]').focus()`
  )
  await call('Input.insertText', { text: 'ru' })
  await until(
    'document.querySelectorAll("tbody tr").length === 1',
    'the filter narrows the listing'
  )
  assert.deepEqual(
    (await rows()).map((row) => row[0]),
    ['run.sas']
  )
  await call('Input.insertText', { text: 'zzz' })
  await until(
    'document.body.innerText.includes("Nothing in this folder matches")',
    'a filter that matches nothing says so'
  )

  // --- the folder's own search -------------------------------------------------

  // The page carries the search box, not the header: the reader has opened THIS
  // folder, and the box searches its file names and the text inside them.
  const field = 'input[aria-label="Search the files in demo"]'
  assert.equal(
    await evaluate(`!!document.querySelector(${JSON.stringify(field)})`),
    true,
    'the page carries a search box'
  )
  await evaluate(`document.querySelector(${JSON.stringify(field)}).focus()`)
  await call('Input.insertText', { text: 'orders' })
  await until(
    'document.body.textContent.includes("line 2: %include")',
    'a body hit with its line'
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
    `document.querySelector('input[aria-label="Search the files in demo"]').focus()`
  )
  await call('Input.insertText', { text: 'orders' })
  await until(
    'folderHarness.requests.includes("fileTree:/Public/demo")',
    'the walk for the first folder is out'
  )
  await evaluate('folderHarness.setPath("/Public/macro")')
  const macroField = 'input[aria-label="Search the files in macro"]'
  await until(
    `!!document.querySelector(${JSON.stringify(macroField)})`,
    'the second folder page'
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

  // and the second folder answers for itself. The pause is not decoration: the
  // page clears the field when it changes folder, so typing before that effect has
  // run types into a query the page is about to overwrite.
  await pause(200)
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
