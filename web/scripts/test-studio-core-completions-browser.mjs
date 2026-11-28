// Full production Studio + real SAS language worker, with only the drive/session API mocked.
// Run `TMPDIR=/home/user node scripts/test-studio-core-completions-browser.mjs`
// after `npm run build`. Requires Chromium and Node with WebSocket.
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { waitForDevTools } from './browser-start.mjs'

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const build = path.join(web, 'build')
const executable = (
  process.env.CHROMIUM
    ? [process.env.CHROMIUM]
    : ['chromium', 'chromium-browser', 'google-chrome']
).find((c) => !spawnSync(c, ['--version'], { stdio: 'ignore' }).error)
assert.ok(executable, 'Chromium not found; set CHROMIUM')
const temp = await mkdtemp(path.join(tmpdir(), 'studio-core-'))
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let server, browser, socket
try {
  server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost')
    const json = (value) => {
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify(value))
    }
    if (url.pathname === '/SASjsApi/session')
      return json({ username: 'tester', displayName: 'Tester', isAdmin: true })
    if (url.pathname === '/SASjsApi/info')
      return json({
        mode: 'desktop',
        runTimes: ['sas'],
        authProviders: [],
        version: 'test'
      })
    if (url.pathname === '/SASjsApi/info/myAuthorizedRoutes')
      return json({ paths: ['/SASjsApi/code/execute'] })
    if (url.pathname === '/SASjsApi/drive/fileTree')
      return json({
        status: 'success',
        tree: {
          name: 'Drive',
          relativePath: '',
          isFolder: true,
          children: [
            {
              name: 'test.sas',
              relativePath: '/test.sas',
              isFolder: false,
              children: []
            }
          ]
        }
      })
    if (url.pathname === '/SASjsApi/drive/file') {
      res.setHeader('content-type', 'text/plain')
      return res.end('')
    }
    if (url.pathname.startsWith('/SASjsApi/')) {
      res.writeHead(404)
      return res.end('unexpected API ' + url.pathname)
    }
    const name =
      url.pathname === '/studio' || url.pathname === '/'
        ? 'index.html'
        : url.pathname.slice(1)
    const file = path.resolve(build, name)
    if (!file.startsWith(build + path.sep)) {
      res.writeHead(403)
      return res.end()
    }
    try {
      const bytes = await readFile(file)
      const ext = path.extname(file)
      res.setHeader(
        'content-type',
        {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.ttf': 'font/ttf',
          '.json': 'application/json'
        }[ext] || 'application/octet-stream'
      )
      res.end(bytes)
    } catch {
      res.writeHead(404)
      res.end('not found')
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
    {
      stdio: ['ignore', 'ignore', 'pipe'],
      env: { ...process.env, TMPDIR: temp }
    }
  )
  const port = await waitForDevTools(browser)
  let target
  for (let i = 0; i < 100 && !target; i++) {
    target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(
      (p) => p.type === 'page'
    )
    if (!target) await pause(100)
  }
  assert.ok(target, 'browser page target')
  socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.onopen = resolve
    socket.onerror = reject
  })
  let id = 0
  const pending = new Map()
  socket.onmessage = ({ data }) => {
    const m = JSON.parse(data)
    if (!pending.has(m.id)) return
    const p = pending.get(m.id)
    pending.delete(m.id)
    m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result)
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
  const until = async (expression, label, timeout = 30000) => {
    const end = Date.now() + timeout
    while (Date.now() < end) {
      if (await evaluate(expression)) return
      await pause(100)
    }
    throw new Error(
      `Timed out: ${label}; DOM: ${await evaluate('document.body.innerText.slice(0,3000)')}`
    )
  }
  const key = async (key, code, windowsVirtualKeyCode, modifiers = 0) => {
    for (const type of ['keyDown', 'keyUp'])
      await call('Input.dispatchKeyEvent', {
        type,
        key,
        code,
        windowsVirtualKeyCode,
        modifiers
      })
  }
  await call('Page.enable')
  // Observe the real worker protocol, without substituting a language server.
  await call('Page.addScriptToEvaluateOnNewDocument', {
    source: `(() => {
    const OriginalWorker = window.Worker;
    window.lspTrace = { sent: [], received: [] };
    window.Worker = class extends OriginalWorker {
      constructor(...args) {
        super(...args);
        this.addEventListener('message', e => {
          const m = e.data;
          if (m && (m.id !== undefined || m.method === 'textDocument/publishDiagnostics')) window.lspTrace.received.push(m);
        });
      }
      postMessage(m, ...rest) {
        if (m && m.method) window.lspTrace.sent.push(m);
        return super.postMessage(m, ...rest);
      }
    };
  })()`
  })
  await call('Page.navigate', {
    url: `http://127.0.0.1:${server.address().port}/studio?filePath=%2Ftest.sas`
  })
  await until(
    `!!document.querySelector('.monaco-editor textarea.inputarea')`,
    'full Studio editor'
  )
  await until(
    `(() => { const req = lspTrace.sent.find(x => x.method === 'initialize'); return req && lspTrace.received.some(x => x.id === req.id && !x.method && x.result?.capabilities); })()`,
    'real language worker initialized',
    60000
  )
  await until(
    `lspTrace.sent.some(x => x.method === 'textDocument/didOpen' && x.params.textDocument.languageId === 'sas')`,
    'SAS document opened in language worker'
  )
  const open = await evaluate(
    `lspTrace.sent.find(x => x.method === 'textDocument/didOpen').params.textDocument`
  )
  console.log(`Studio loaded; LSP initialized; didOpen=${JSON.stringify(open)}`)
  const textarea = '.monaco-editor textarea.inputarea'
  const editorTextExpression = `document.querySelector('.monaco-editor .view-lines').innerText.replace(/\\u00a0/g, ' ')`
  const editorText = () => evaluate(editorTextExpression)
  // Monaco updates its model/textarea before its rendered view; CDP input completion
  // does not guarantee a paint. Wait for the exact visible text, not a delay.
  const expectEditorText = async (text, label) => {
    await until(`${editorTextExpression} === ${JSON.stringify(text)}`, label)
    assert.equal(await editorText(), text, label)
  }
  const expectSelection = async (text, label) => {
    await until(
      `(() => { const el = document.querySelector(${JSON.stringify(textarea)}); return document.activeElement === el && el.value.slice(el.selectionStart, el.selectionEnd) === ${JSON.stringify(text)} })()`,
      label
    )
  }
  const prepare = async (text, requireLsp = true) => {
    await key('Escape', 'Escape', 27)
    await evaluate(
      `document.querySelector(${JSON.stringify(textarea)}).focus()`
    )
    await key('a', 'KeyA', 65, 2)
    await call('Input.insertText', { text })
    await until(
      `lspTrace.sent.some(x => x.method === 'textDocument/didChange' && x.params.contentChanges[0].text === ${JSON.stringify(text)})`,
      `LSP sync for ${text}`
    )
    if (requireLsp) await key('Escape', 'Escape', 27)
    const before = await evaluate(
      `lspTrace.sent.filter(x => x.method === 'textDocument/completion').length`
    )
    await key(' ', 'Space', 32, 2)
    if (requireLsp) {
      await until(
        `lspTrace.sent.filter(x => x.method === 'textDocument/completion').length > ${before}`,
        `LSP completion request for ${text}`
      )
      await until(
        `(() => { const req = lspTrace.sent.filter(x => x.method === 'textDocument/completion').at(-1); return lspTrace.received.some(x => x.id === req.id && !x.method && ('result' in x || 'error' in x)) })()`,
        `LSP completion response for ${text}`
      )
      const response = await evaluate(
        `(() => { const req = lspTrace.sent.filter(x => x.method === 'textDocument/completion').at(-1); return lspTrace.received.find(x => x.id === req.id && !x.method) })()`
      )
      assert.ok(
        !response.error,
        `LSP completion failed: ${JSON.stringify(response.error)}`
      )
    }
    await until(
      `!!document.querySelector('.suggest-widget.visible .monaco-list-row')`,
      `suggest widget for ${text}`
    )
  }
  const rows = () =>
    evaluate(
      `Array.from(document.querySelectorAll('.suggest-widget.visible .monaco-list-row')).map(x => x.getAttribute('aria-label'))`
    )
  await prepare('%mf_deletefile')
  const coreRows = await rows()
  assert.equal(
    coreRows.filter((x) => x.toLowerCase() === 'mf_deletefile').length,
    1,
    `core rows: ${JSON.stringify(coreRows)}`
  )
  assert.equal(
    coreRows[0].toLowerCase(),
    'mf_deletefile',
    'core is focused before Enter'
  )
  await key('Enter', 'Enter', 13)
  await expectEditorText('%mf_deletefile(file)', 'core insertion')
  await expectSelection('file', 'core argument selected')
  await call('Input.insertText', { text: 'demo.txt' })
  await expectEditorText(
    '%mf_deletefile(demo.txt)',
    'core argument placeholder selected'
  )
  // A suggestion may appear while editing an argument. Reproduce that state
  // explicitly so Tab navigation is tested even when the worker is fast.
  await key(' ', 'Space', 32, 2)
  await until(
    `!!document.querySelector('.suggest-widget.visible .monaco-list-row')`,
    'suggestions while editing core argument'
  )
  // Tab accepts a focused suggestion before it navigates a snippet. Dismiss
  // the widget first so this assertion tests snippet navigation, not completion.
  await key('Escape', 'Escape', 27)
  await until(
    `!document.querySelector('.suggest-widget.visible')`,
    'argument suggestions dismissed'
  )
  await key('Tab', 'Tab', 9)
  await call('Input.insertText', { text: ';' })
  await expectEditorText(
    '%mf_deletefile(demo.txt);',
    'Tab exits core snippet'
  )
  console.log(
    `core rows=${JSON.stringify(coreRows)} accepted=%mf_deletefile(file) placeholder=demo.txt final=%mf_deletefile(demo.txt);`
  )

  await prepare('atan2', false)
  const sasRows = await rows()
  assert.equal(
    sasRows.filter((x) => x.toLowerCase().startsWith('atan2')).length,
    1,
    `SAS rows: ${JSON.stringify(sasRows)}`
  )
  assert.ok(
    sasRows[0].toLowerCase().startsWith('atan2'),
    'SAS function is focused before Enter'
  )
  await key('Enter', 'Enter', 13)
  await expectEditorText('atan2(x, y)', 'SAS insertion')
  await expectSelection('x', 'SAS first argument selected')
  await call('Input.insertText', { text: '1' })
  await expectEditorText('atan2(1, y)', 'SAS first argument replaced')
  await key('Tab', 'Tab', 9)
  await expectSelection('y', 'SAS second argument selected')
  await call('Input.insertText', { text: '2' })
  await expectEditorText('atan2(1, 2)', 'SAS second argument replaced')
  console.log(
    `SAS rows=${JSON.stringify(sasRows)} accepted=atan2(x, y) final=atan2(1, 2)`
  )
  console.log('Studio core + SAS completions passed with real LSP')
} finally {
  socket?.close()
  if (browser && browser.exitCode === null) {
    const exited = new Promise((resolve) => browser.once('exit', resolve))
    browser.kill()
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
