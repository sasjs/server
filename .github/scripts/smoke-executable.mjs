// Boots a built executable and waits for its API to answer.
//
// The executables are the only shape this server ships that runs on the
// small-icu Node `pkg` embeds, so they are the only shape where the runtime
// itself can differ from a source checkout - and no other job executes one:
// `build.yml` boots `node build/src/server.js` on the runner's full-icu Node.
// Three releases (v3.10.0, v3.11.0, v3.11.1) therefore shipped binaries that
// died on their first log line while every unit and integration job stayed
// green.
//
// Desktop mode is deliberate: no database, no SAS, no login, so the check needs
// nothing but the binary and a spare port.
//
// usage: node .github/scripts/smoke-executable.mjs <path-to-executable>
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

const READY_TIMEOUT_MS = 90_000
const POLL_INTERVAL_MS = 500
const TAIL_LINES = 20

const executable = process.argv[2]

if (!executable) {
  console.error('smoke-executable: expected the path to an executable')
  process.exit(1)
}

const executablePath = path.resolve(executable)

if (!fs.existsSync(executablePath)) {
  console.error(`smoke-executable: ${executablePath} does not exist`)
  process.exit(1)
}

const freePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer()

    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()

      server.close(() => resolve(port))
    })
  })

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sasjs-smoke-'))
const port = await freePort()
const baseUrl = `http://127.0.0.1:${port}`

const env = {
  ...process.env,
  MODE: 'desktop',
  RUN_TIMES: 'js',
  // The js runtime spawns stored programs with this interpreter, and desktop
  // mode reads it before it listens.
  NODE_PATH: process.execPath,
  SASJS_ROOT: path.join(workDir, 'sasjs_root'),
  HTTP_PORT: String(port)
}

// A leftover value from the caller would make the server validate a shape this
// smoke test does not intend to test, or refuse to start for an unrelated
// reason.
for (const name of ['NODE_ENV', 'PORT', 'HTTPS_PORT', 'PROTOCOL', 'LOG_LEVEL'])
  delete env[name]

const output = []

const record = (chunk) => {
  for (const line of String(chunk).split(/\r?\n/))
    if (line.trim() !== '') output.push(line)
}

const child = spawn(executablePath, [], {
  cwd: workDir,
  env,
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true
})

child.stdout.on('data', record)
child.stderr.on('data', record)

let exited = null

child.on('exit', (code, signal) => {
  exited = { code, signal }
})

const reporter = (lines) =>
  lines.length > 0 ? lines : ['(the executable printed nothing)']

const fail = (reason) => {
  console.error(`::error title=smoke-executable::${reason}`)
  console.error('--- executable output ---')
  console.error(reporter(output).join('\n'))
  console.error('--- end of output ---')
  child.kill('SIGKILL')
  process.exit(1)
}

const finish = (lines) => {
  console.log(`the executable answered ${baseUrl}/SASjsApi/info`)
  console.log(lines.join('\n'))
  child.kill('SIGTERM')
  // Nothing is waiting on the child, but a hung process would leave the job
  // running until its timeout, so the exit is explicit.
  setTimeout(() => {
    child.kill('SIGKILL')
    process.exit(0)
  }, 2_000).unref()
}

const deadline = Date.now() + READY_TIMEOUT_MS

while (Date.now() < deadline) {
  if (exited) fail(`the executable exited before it was ready (${JSON.stringify(exited)})`)

  try {
    const response = await fetch(`${baseUrl}/SASjsApi/info`, {
      signal: AbortSignal.timeout(2_000)
    })

    if (response.ok) {
      const info = await response.json()

      // A 200 alone could come from anything answering on the port; the payload
      // is what proves this process started its own runtimes.
      if (!Array.isArray(info.runTimes) || !info.runTimes.includes('js'))
        fail(
          `the executable answered but reported runTimes ${JSON.stringify(
            info.runTimes
          )}`
        )

      finish(output.slice(-TAIL_LINES))
      break
    }
  } catch {
    // not listening yet, or the connection was refused - keep waiting
  }

  await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
}

if (!exited && Date.now() >= deadline)
  fail(`no answer on ${baseUrl}/SASjsApi/info after ${READY_TIMEOUT_MS / 1000}s`)
