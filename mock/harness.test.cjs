const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')
const { waitForMockReady } = require('./mock-ready.cjs')
const { runBrowser } = require('./test-built-site.cjs')
const { selectCases } = require('./format.browser.test.cjs')

test('formatter cases skip a changed upstream fragment but retain the crafted full-output case', () => {
  const warnings = []
  const cases = selectCases(
    { status: 200, text: '%macro mf_getfilesize();\n%mend mf_getfilesize;' },
    (message) => warnings.push(message)
  )
  assert.deepEqual(
    cases.map(({ name }) => name),
    ['crafted joined %end']
  )
  assert.ok(cases[0].expected, 'crafted case checks complete output')
  assert.match(warnings.join('\n'), /skip.*mf_getfilesize.*fragment/i)
})

test('formatter cases retain a matching drive file and reject failed fetches', () => {
  const text = `%macro mf_getfilesize();
  %if &format=NO %then %do;
    &bytes
  %end;
  %else %do;
    %sysfunc(INPUTN(&bytes, best.),sizekmg.)
  %end;
%mend mf_getfilesize;`
  const warnings = []
  const cases = selectCases({ status: 200, text }, (s) => warnings.push(s))
  assert.deepEqual(
    cases.map(({ name }) => name),
    ['drive mf_getfilesize', 'crafted joined %end']
  )
  assert.equal(cases[0].input, text)
  assert.deepEqual(warnings, [])
  const reindented = text.replace('\n  %if', '\n   %if')
  assert.deepEqual(
    selectCases({ status: 200, text: reindented }, () => {}).map(
      ({ name }) => name
    ),
    ['crafted joined %end']
  )
  assert.throws(() => selectCases({ status: 404, text: '' }), /Cannot read/)
})

test('mock readiness rejects a stalled promise within its deadline', async () => {
  const page = {
    evaluate: (fn, timeout) => {
      global.window = { __sasjsMockReady: new Promise(() => {}) }
      return fn(timeout).finally(() => delete global.window)
    }
  }
  await assert.rejects(waitForMockReady(page, 30), /mock readiness timed out/i)
})

test(
  'browser temp root supports Chromium socket paths with a long TMPDIR',
  {
    skip: process.platform !== 'linux' && 'Linux Unix socket limit regression'
  },
  () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mock-long-tmp-'))
    const longTmp = path.join(root, 'x'.repeat(90))
    fs.mkdirSync(longTmp)
    const script = path.join(root, 'socket.cjs')
    fs.writeFileSync(
      script,
      `
    const fs = require('node:fs')
    const net = require('node:net')
    const path = require('node:path')
    const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR, 'org.chromium.Chromium.'))
    fs.writeFileSync(process.env.RECORD, JSON.stringify({ root: process.env.TMPDIR, mode: fs.statSync(process.env.TMPDIR).mode & 0o777 }))
    const server = net.createServer()
    server.on('error', (err) => { console.error(err); process.exitCode = 1 })
    server.listen(path.join(tmp, 'SingletonSocket'), () => server.close())
  `
    )
    try {
      const driver = `require(${JSON.stringify(path.join(__dirname, 'test-built-site.cjs'))}).runBrowser(${JSON.stringify(script)}, process.env, 5000).then(code => process.exitCode = code)`
      const result = spawnSync(process.execPath, ['-e', driver], {
        env: {
          ...process.env,
          TMPDIR: longTmp,
          TMP: longTmp,
          TEMP: longTmp,
          RECORD: path.join(root, 'record.json')
        },
        encoding: 'utf8',
        timeout: 10000
      })
      assert.equal(result.status, 0, result.stderr || String(result.error))
      const privateRoot = JSON.parse(
        fs.readFileSync(path.join(root, 'record.json'), 'utf8')
      )
      assert.equal(privateRoot.mode, 0o700, 'browser temp root is private')
      assert.equal(
        fs.existsSync(privateRoot.root),
        false,
        'browser temp root removed'
      )
      assert.deepEqual(fs.readdirSync(longTmp), [], 'temporary root cleaned up')
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  }
)

test(
  'browser watchdog kills a stubborn process group and removes its temp root',
  {
    skip:
      process.platform !== 'linux'
        ? 'process-group and /proc verification requires Linux'
        : !fs.existsSync('/proc/self/stat') && 'requires a mounted Linux /proc'
  },
  async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mock-watchdog-test-'))
    const script = path.join(root, 'stall.cjs')
    const record = path.join(root, 'record.json')
    fs.writeFileSync(
      script,
      `
    const fs = require('node:fs')
    const { spawn } = require('node:child_process')
    process.on('SIGTERM', () => {})
    const child = spawn(process.execPath, ['-e', "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)"], { stdio: 'ignore' })
    fs.writeFileSync(process.env.RECORD, JSON.stringify({ pid: child.pid, tmp: process.env.TMPDIR }))
    setInterval(() => {}, 1000)
  `
    )
    try {
      const result = await runBrowser(
        script,
        { ...process.env, RECORD: record },
        1000
      )
      assert.equal(result, 1)
      const { pid, tmp } = JSON.parse(fs.readFileSync(record, 'utf8'))
      assert.equal(
        fs.existsSync(tmp),
        false,
        'private browser temp root removed'
      )
      // Linux can briefly retain a reparented zombie; it is no longer running.
      let running = false
      try {
        const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8')
        running = stat.slice(stat.lastIndexOf(')') + 2)[0] !== 'Z'
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
      assert.equal(running, false, 'stubborn browser process stopped')
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  }
)
