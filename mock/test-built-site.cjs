// Run the browser regression against the site just built, before publishing it.
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

async function runBrowser(script, env, timeout = 120000) {
  // Chromium creates a Unix socket under TMPDIR. Linux sun_path is 108 bytes,
  // including the terminator; reserve space for Chromium's generated suffix.
  const parent = os.tmpdir()
  const socket = path.join(
    parent,
    'b-XXXXXX',
    'org.chromium.Chromium.XXXXXX',
    'SingletonSocket'
  )
  const root =
    process.platform === 'linux' && Buffer.byteLength(socket) >= 108
      ? '/tmp'
      : parent
  const tmp = fs.mkdtempSync(path.join(root, 'b-'))
  try {
    const test = spawn(process.execPath, [script], {
      stdio: 'inherit',
      env: { ...env, TMPDIR: tmp, TMP: tmp, TEMP: tmp },
      detached: process.platform !== 'win32'
    })
    return await new Promise((resolve, reject) => {
      let timedOut = false
      const timer = setTimeout(() => {
        timedOut = true
        console.error(`Browser regression timed out after ${timeout}ms`)
        // Kill the whole group while the leader is still unreaped: Chromium and
        // Playwright may both be wedged, so killing only Node would orphan them.
        try {
          if (process.platform === 'win32') test.kill('SIGKILL')
          else process.kill(-test.pid, 'SIGKILL')
        } catch (error) {
          if (error.code !== 'ESRCH') throw error
        }
      }, timeout)
      test.once('error', (error) => {
        clearTimeout(timer)
        reject(error)
      })
      test.once('exit', (code, signal) => {
        clearTimeout(timer)
        resolve(timedOut ? 1 : (code ?? (signal ? 1 : 0)))
      })
    })
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}

async function main() {
  const server = spawn(
    process.execPath,
    [path.join(__dirname, 'serve.mjs'), '0'],
    { stdio: ['ignore', 'pipe', 'inherit'] }
  )
  try {
    // serve.mjs reports the actual port, so concurrent builds cannot collide.
    const port = await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Mock server did not start')),
        10000
      )
      const fail = (error) => {
        clearTimeout(timer)
        reject(error)
      }
      server.once('error', fail)
      server.once('exit', (code) =>
        fail(new Error(`Mock server exited: ${code}`))
      )
      let output = ''
      server.stdout.on('data', (data) => {
        output += data.toString()
        const match = /Mock site on http:\/\/localhost:(\d+)/.exec(output)
        if (match) {
          clearTimeout(timer)
          resolve(match[1])
        }
      })
    })
    const code = await runBrowser(
      path.join(__dirname, 'format.browser.test.cjs'),
      {
        ...process.env,
        MOCK_HOSTED: 'true',
        MOCK_SITE_URL: `http://127.0.0.1:${port}/`
      }
    )
    if (code !== 0) process.exitCode = code
  } finally {
    if (server.exitCode === null && server.signalCode === null) {
      const exited = new Promise((resolve) => server.once('exit', resolve))
      server.kill('SIGKILL')
      await exited
    }
  }
}

module.exports = { runBrowser }
if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
