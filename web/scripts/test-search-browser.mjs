// Exercise the real Search component in Chromium, with only its network mocked.
// Run: npm run test:search-browser (requires Chromium on PATH).
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import webpack from 'webpack'

const candidates = process.env.CHROMIUM
  ? [process.env.CHROMIUM]
  : ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable']
const executable = candidates.find(
  (candidate) => !spawnSync(candidate, ['--version'], { stdio: 'ignore' }).error
)
assert.ok(executable, 'Chromium not found; set CHROMIUM to its executable')
const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const temp = await mkdtemp(path.join(tmpdir(), 'sasjs-search-test-'))
let server, browser, socket
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
try {
  const compiler = webpack({
    mode: 'development',
    devtool: false,
    context: web,
    entry: './scripts/fixtures/search-browser.tsx',
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
    { stdio: 'ignore' }
  )
  let port
  for (let n = 0; n < 100; n++) {
    try {
      port = (
        await readFile(path.join(temp, 'profile/DevToolsActivePort'), 'utf8')
      ).split('\n')[0]
      break
    } catch {
      await pause(100)
    }
  }
  assert.ok(port, 'Chromium did not start')
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
  socket = new WebSocket(
    targets.find((target) => target.type === 'page').webSocketDebuggerUrl
  )
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
  const navigate = async (viewport) => {
    await call('Emulation.setDeviceMetricsOverride', {
      width: viewport,
      height: 800,
      deviceScaleFactor: 1,
      mobile: viewport < 600
    })
    await call('Page.navigate', {
      url: `http://127.0.0.1:${server.address().port}/`
    })
    await until(
      '!!window.searchHarness && !!document.querySelector("input")',
      'component mount'
    )
    await pause(300)
  }
  const walkCount = () =>
    evaluate(
      'searchHarness.requests.filter(x => x.startsWith("/SASjsApi/drive/fileTree:")).length'
    )
  const type = async (selector, text) => {
    await evaluate(
      `document.querySelector(${JSON.stringify(selector)}).focus()`
    )
    await call('Input.insertText', { text })
  }
  const clear = async (selector) => {
    await evaluate(
      `(() => { const input = document.querySelector(${JSON.stringify(selector)}); input.focus(); input.select() })()`
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
  }

  await navigate(1200)
  assert.equal(await walkCount(), 0, 'entering Studio must not walk the drive')
  const desktop = 'input[aria-label="Search the drive"]'
  await evaluate(`document.querySelector(${JSON.stringify(desktop)}).focus()`)
  await pause(100)
  assert.equal(
    await walkCount(),
    0,
    'focusing the desktop search must not walk'
  )
  await type(desktop, ' o')
  await pause(150)
  assert.equal(await walkCount(), 0, 'a single trimmed character must not walk')
  await evaluate('searchHarness.setHold(true)')
  await type(desktop, 'r')
  await until(
    '(searchHarness.requests.filter(x => x.startsWith("/SASjsApi/drive/fileTree:")).length === 1)',
    'walk starts for two characters'
  )
  await until(
    'document.body.textContent.includes("Searching…")',
    'loading shown'
  )
  await evaluate('searchHarness.setHold(false); searchHarness.release()')
  await until('document.body.textContent.includes("orders.sas")', 'name result')
  await clear(desktop)
  await type(desktop, 'reports')
  await until('document.body.textContent.includes("orders.sas")', 'path result')
  assert.equal(await walkCount(), 1, 'repeated searches use the same walk')
  await evaluate('searchHarness.navigate("/docs")')
  await until(
    `!!document.querySelector('input[aria-label="Search the documentation"]')`,
    'docs scope'
  )
  assert.equal(
    await evaluate('document.body.textContent.includes("orders.sas")'),
    false,
    'no drive result on docs'
  )
  const docsField = 'input[aria-label="Search the documentation"]'
  await type(docsField, 'orders')
  await until(
    'document.body.textContent.includes("Orders docs")',
    'docs results'
  )
  await evaluate('searchHarness.navigate("/studio")')
  await until(
    `!!document.querySelector('input[aria-label="Search the drive"]')`,
    'return to Studio'
  )
  await pause(150)
  assert.equal(
    await walkCount(),
    1,
    'return to Studio does not walk automatically'
  )
  assert.equal(
    await evaluate(`document.querySelector(${JSON.stringify(desktop)}).value`),
    '',
    'docs query must not carry into Studio'
  )
  await type(desktop, 'reports')
  await until(
    'document.body.textContent.includes("orders.sas")',
    'cached result after return'
  )
  assert.equal(await walkCount(), 1, 'return to Studio reuses session cache')
  await evaluate('searchHarness.setSignedIn(false)')
  await until('!document.querySelector("input")', 'signed out')
  await evaluate('searchHarness.setSignedIn(true)')
  await until(
    `!!document.querySelector('input[aria-label="Search the drive"]')`,
    'signed in again'
  )
  await type(desktop, 'orders')
  await until(
    'document.body.textContent.includes("orders.sas")',
    'new session result'
  )
  assert.equal(
    await walkCount(),
    2,
    'new session must not reuse prior caller drive cache'
  )
  await evaluate('searchHarness.setAllowed(false)')
  await until(
    `!!document.querySelector('input[aria-label="Search the documentation and the API"]')`,
    'drive grant revoked'
  )
  assert.equal(
    await evaluate('document.body.textContent.includes("orders.sas")'),
    false,
    'revoked grant hides paths'
  )
  await evaluate('searchHarness.setAllowed(true)')
  await until(
    `!!document.querySelector('input[aria-label="Search the drive"]')`,
    'drive grant restored'
  )
  await pause(150)
  assert.equal(
    await walkCount(),
    2,
    'restoring grant does not search automatically'
  )
  await type(desktop, 'orders')
  await until(
    'document.body.textContent.includes("orders.sas")',
    'search after grant restored'
  )
  assert.equal(await walkCount(), 3, 'restored grant starts a fresh walk')
  console.log(
    'desktop: idle, focus and one character do not walk; search, loading, path, scope and cache verified'
  )

  await navigate(400)
  assert.equal(
    await walkCount(),
    0,
    'mobile Studio must not walk before search'
  )
  await evaluate(
    `document.querySelector('button[aria-label="Search the drive"]').click()`
  )
  await until(
    '!!document.querySelector("[role=dialog] input")',
    'mobile dialog'
  )
  assert.equal(await walkCount(), 0, 'opening mobile search must not walk')
  await type('[role=dialog] input', 'or')
  await until(
    'document.body.textContent.includes("orders.sas")',
    'mobile result'
  )
  assert.equal(await walkCount(), 1, 'mobile search starts one walk')
  console.log('mobile: opening dialog does not walk; typing searches')

  await navigate(1200)
  await evaluate('searchHarness.setHold(true)')
  await type(desktop, 'orders')
  await until(
    '(searchHarness.requests.filter(x => x.startsWith("/SASjsApi/drive/fileTree:")).length === 1)',
    'pending walk'
  )
  await evaluate('searchHarness.navigate("/docs")')
  await until(
    `!!document.querySelector('input[aria-label="Search the documentation"]')`,
    'leave pending search'
  )
  await evaluate('searchHarness.setHold(false); searchHarness.release()')
  await type(docsField, 'orders')
  await until(
    'document.body.textContent.includes("Orders docs")',
    'docs after late drive response'
  )
  assert.equal(
    await evaluate('document.body.textContent.includes("orders.sas")'),
    false,
    'late drive response cannot leak into docs'
  )
  await evaluate('searchHarness.navigate("/api")')
  await until(
    `!!document.querySelector('input[aria-label="Search the API"]')`,
    'API scope'
  )
  await type('input[aria-label="Search the API"]', 'orders')
  await until(
    'document.body.textContent.includes("GET /orders")',
    'API results'
  )
  await evaluate('searchHarness.navigate("/apps")')
  await until(
    `!!document.querySelector('input[aria-label="Search the apps"]')`,
    'apps scope'
  )
  await type('input[aria-label="Search the apps"]', 'orders')
  await until(
    'document.body.textContent.includes("orders app")',
    'apps results'
  )
  console.log(
    'scope changes and late drive response do not contaminate docs, API or apps'
  )

  await navigate(1200)
  await evaluate('searchHarness.setFail(true)')
  await type(desktop, 'orders')
  await until(
    'document.body.textContent.includes("Nothing matches")',
    'failed walk produces no results'
  )
  assert.equal(await walkCount(), 1, 'failed walk asked once')
  await clear(desktop)
  await evaluate('searchHarness.setFail(false)')
  await type(desktop, 'orders')
  await until(
    'document.body.textContent.includes("orders.sas")',
    'retry after empty walk'
  )
  assert.equal(await walkCount(), 2, 'failed walk is retried on the next query')
  console.log('failed walk shows no matches and can be retried')

  await navigate(1200)
  await evaluate('searchHarness.setHold(true)')
  await type(desktop, 'orders')
  await until(
    '(searchHarness.requests.filter(x => x.startsWith("/SASjsApi/drive/fileTree:")).length === 1)',
    'pending search before clearing'
  )
  await clear(desktop)
  await type(desktop, 'reports')
  await evaluate('searchHarness.setHold(false); searchHarness.release()')
  await until(
    'document.body.textContent.includes("orders.sas")',
    'current query after pending walk'
  )
  assert.equal(
    await walkCount(),
    1,
    'clearing during a walk reuses the in-flight walk'
  )
  console.log(
    'clearing and retyping during a walk shows only the current query'
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
