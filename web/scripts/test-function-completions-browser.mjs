// Real Monaco insertion and tab stops. Run: npm run test:completions-browser.
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import webpack from 'webpack'
import { waitForDevTools } from './browser-start.mjs'

const executable = [
  process.env.CHROMIUM,
  'chromium',
  'chromium-browser',
  'google-chrome'
]
  .filter(Boolean)
  .find((c) => !spawnSync(c, ['--version'], { stdio: 'ignore' }).error)
assert.ok(executable, 'Chromium not found; set CHROMIUM')
const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const temp = await mkdtemp(path.join(tmpdir(), 'sas-function-monaco-'))
let server, browser, socket
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
try {
  const compiler = webpack({
    mode: 'development',
    devtool: false,
    context: web,
    entry: './scripts/fixtures/function-completions-browser.ts',
    output: { path: temp, filename: 'bundle.js' },
    resolve: { extensions: ['.ts', '.js'] },
    module: {
      rules: [
        {
          test: /\.ts$/,
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
        },
        { test: /\.css$/, use: ['style-loader', 'css-loader'] },
        { test: /\.ttf$/, type: 'asset/resource' }
      ]
    }
  })
  await new Promise((resolve, reject) =>
    compiler.run((err, stats) =>
      err
        ? reject(err)
        : stats.hasErrors()
          ? reject(new Error(stats.toString({ all: false, errors: true })))
          : resolve()
    )
  )
  await new Promise((resolve) => compiler.close(resolve))
  server = createServer(async (req, res) => {
    if (req.url === '/bundle.js') {
      res.setHeader('content-type', 'application/javascript')
      res.end(await readFile(path.join(temp, 'bundle.js')))
    } else if (req.url.endsWith('.js')) {
      res.setHeader('content-type', 'application/javascript')
      res.end(await readFile(path.join(temp, path.basename(req.url))))
    } else {
      res.setHeader('content-type', 'text/html')
      res.end(
        '<!doctype html><style>html,body,#root{height:100%;margin:0}</style><div id="root"></div><script src="/bundle.js"></script>'
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
  let target
  for (let i = 0; i < 100 && !target; i++) {
    target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(
      (p) => p.type === 'page'
    )
    if (!target) await pause(100)
  }
  assert.ok(target, 'browser has a page target')
  socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.onopen = resolve
    socket.onerror = reject
  })
  let id = 0
  const pending = new Map()
  socket.onmessage = ({ data }) => {
    const m = JSON.parse(data)
    if (pending.has(m.id)) {
      const p = pending.get(m.id)
      pending.delete(m.id)
      m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result)
    }
  }
  const call = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const n = ++id
      pending.set(n, { resolve, reject })
      socket.send(JSON.stringify({ id: n, method, params }))
    })
  const evaluate = async (expression) => {
    const r = await call('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    })
    if (r.exceptionDetails)
      throw new Error(
        r.exceptionDetails.exception?.description ?? r.exceptionDetails.text
      )
    return r.result.value
  }
  const until = async (expression, label) => {
    for (let i = 0; i < 200; i++) {
      if (await evaluate(expression)) return
      await pause(50)
    }
    throw new Error(`Timed out: ${label}`)
  }
  const key = async (key, code, windowsVirtualKeyCode) => {
    for (const type of ['keyDown', 'keyUp'])
      await call('Input.dispatchKeyEvent', {
        type,
        key,
        code,
        windowsVirtualKeyCode
      })
  }
  await call('Page.navigate', {
    url: `http://127.0.0.1:${server.address().port}/`
  })
  await until('!!window.testEditor', 'Monaco mount')
  await evaluate(
    "testEditor.focus(); testEditor.trigger('test','editor.action.triggerSuggest',{})"
  )
  await until(
    "!!document.querySelector('.suggest-widget.visible')",
    'suggest widget'
  )
  await key('Enter', 'Enter', 13)
  await until("testEditor.getValue() !== 'atan2'", 'suggestion insertion')
  assert.equal(await evaluate('testEditor.getValue()'), 'atan2(x, y)')
  const selection = () =>
    evaluate('testEditor.getModel().getValueInRange(testEditor.getSelection())')
  assert.equal(await selection(), 'x', 'first argument is selected')
  await key('Tab', 'Tab', 9)
  assert.equal(await selection(), 'y', 'Tab selects second argument')
  await key('Tab', 'Tab', 9)
  assert.equal(await selection(), '', 'last Tab exits placeholders')
  assert.equal(
    await evaluate('testEditor.getPosition().column'),
    12,
    'cursor ends after call'
  )
  await evaluate(
    "testEditor.setValue('compound'); testEditor.setPosition({lineNumber:1,column:9}); testEditor.focus(); testEditor.trigger('test','editor.action.triggerSuggest',{})"
  )
  await until(
    "!!document.querySelector('.suggest-widget.visible')",
    'compound suggest widget'
  )
  await key('Enter', 'Enter', 13)
  await until("testEditor.getValue() !== 'compound'", 'compound insertion')
  assert.equal(
    await evaluate('testEditor.getValue()'),
    'compound(init-amt, future-amt, interest-rate, num-periods)'
  )
  for (const argument of [
    'init-amt',
    'future-amt',
    'interest-rate',
    'num-periods'
  ]) {
    assert.equal(await selection(), argument)
    await key('Tab', 'Tab', 9)
  }
  assert.equal(await selection(), '')
  const source = '%let z=%bquote(%();\n%put TAIL;\n'
  const formatted = await evaluate(`testFormat(${JSON.stringify(source)})`)
  assert.equal(
    formatted.first,
    source,
    'LSP must preserve marked delimiters and suffix'
  )
  assert.equal(
    formatted.second,
    formatted.first,
    'LSP formatting must be idempotent'
  )
  console.log('Monaco completions and real language-worker formatting passed')
} finally {
  socket?.close()
  /* Chromium keeps writing its profile while it shuts down, and removing the
     directory underneath it fails with ENOTEMPTY - which took the e2e job down
     after the assertions had already passed. Wait for the exit, then retry a
     removal that a late flush can still race. */
  if (browser && browser.exitCode === null) {
    const exited = new Promise((resolve) => browser.once('exit', resolve))
    browser.kill()
    // A browser that refuses to die must not hang the job; the retrying
    // removal below copes with a profile it is still writing.
    await Promise.race([exited, pause(5000)])
  }
  if (server) await new Promise((resolve) => server.close(resolve))
  await rm(temp, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 100
  })
}
