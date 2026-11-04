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

// pkg's default cache, in the home directory. Captured before the executable
// starts so a folder left by an earlier run on the runner is not read as this
// one's (sasjs/server#523).
const homeCacheDir = path.join(os.homedir(), '.cache', 'pkg')
const homeCacheBefore = new Set(
  fs.existsSync(homeCacheDir) ? fs.readdirSync(homeCacheDir) : []
)

const env = {
  ...process.env,
  MODE: 'desktop',
  RUN_TIMES: 'js',
  // The js runtime spawns stored programs with this interpreter, and desktop
  // mode reads it before it listens.
  NODE_PATH: process.execPath,
  SASJS_ROOT: path.join(workDir, 'sasjs_root'),
  HTTP_PORT: String(port),
  // /ddc-host is a testing tool and 404s unless asked for; the asset check
  // below is about what the snapshot carries, so it has to be reachable.
  DDC_HOST_ENABLED: 'true'
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

// Set only by `finish()`. The tail check below reads it rather than the clock:
// an answer that arrives on the last poll leaves the child alive, so a deadline
// comparison there would report a healthy binary as a timeout.
let passed = false

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
  passed = true

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

/**
 * The routes whose files are read from disk per request rather than compiled in.
 *
 * `pkg` only carries what `pkg.assets` lists, so a view that is served out of
 * `build/src/views/` is present in a source checkout and in the npm tarball and
 * absent from the snapshot - and no unit test can see the difference, because
 * they read the file straight from the source tree. That is how v3.12.0 and
 * v3.12.1 shipped with `/ddc-host` answering 500.
 */
const checkServedViews = async () => {
  try {
    const page = await fetch(
      `${baseUrl}/ddc-host?url=about%3Ablank&message=%7B%7D&timing=early`,
      { signal: AbortSignal.timeout(5_000) }
    )
    const body = await page.text()

    if (!page.ok)
      fail(
        `the executable answered ${page.status} for /ddc-host: ${body.trim()}`
      )

    // The tag the page needs, and the marker the unit spec pins
    // (routes/spec/ddcHost.spec.ts). Not a substring like "timing": the help text
    // names `timing=early` in prose, so a check for that word passed off the
    // documentation while the script tag itself could have been missing - and an
    // edit to the paragraph failed the smoke test for no reason.
    if (!body.includes('<script src="/ddc-host.js">'))
      fail('/ddc-host answered 200 but the page does not load /ddc-host.js')

    const script = await fetch(`${baseUrl}/ddc-host.js`, {
      signal: AbortSignal.timeout(5_000)
    })
    const scriptBody = await script.text()

    if (!script.ok)
      fail(`the executable answered ${script.status} for /ddc-host.js`)

    // A status is not enough: an asset that ships empty or truncated - the exact
    // failure this check exists for - still answers 200. Assert the content the
    // page needs, the type it is served as, and a floor on its size.
    const contentType = script.headers.get('content-type') ?? ''

    if (!contentType.includes('javascript'))
      fail(`/ddc-host.js was served as ${contentType || '(no content type)'}`)
    if (!scriptBody.includes('startEarlyReplay'))
      fail('/ddc-host.js answered 200 but does not contain startEarlyReplay')
    if (scriptBody.length < 1_000)
      fail(`/ddc-host.js answered 200 with only ${scriptBody.length} bytes`)
  } catch (error) {
    // fail() exits, so reaching here means the request itself threw - a page
    // that cannot be fetched is as broken as one that 500s.
    fail(`could not fetch /ddc-host from the executable: ${error.message}`)
  }

  console.log('the executable served /ddc-host and /ddc-host.js')
}

/**
 * Where pkg unpacks the assets it serves (sasjs/server#523).
 *
 * pkg extracts a snapshot file the first time the executable asks for it, into
 * whatever `PKG_NATIVE_CACHE_PATH` names AT THAT MOMENT - so this is the check
 * that the redirect from `setProcessVariables` happens before anything reads a
 * snapshot file. A source checkout and the npm package run no pkg prelude at
 * all, which is why no unit test can see this.
 */
const checkPkgCache = () => {
  const tmpFolder = path.join(env.SASJS_ROOT, 'tmp')
  const folders = fs.existsSync(tmpFolder)
    ? fs.readdirSync(tmpFolder).filter((entry) => entry.startsWith('pkg-cache-'))
    : []

  if (folders.length !== 1)
    fail(
      `expected one pkg cache folder under ${tmpFolder}, found ${folders.length}`
    )

  const countFiles = (folder) => {
    let total = 0

    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      if (entry.isDirectory()) total += countFiles(path.join(folder, entry.name))
      else if (entry.isFile()) total += 1
    }

    return total
  }

  const files = countFiles(path.join(tmpFolder, folders[0]))

  // An empty folder means the assets came from somewhere else - the redirect
  // happened but nothing was unpacked into it.
  if (files === 0)
    fail(`the pkg cache folder ${folders[0]} is empty`)

  const homeCacheNow = new Set(
    fs.existsSync(homeCacheDir) ? fs.readdirSync(homeCacheDir) : []
  )
  const leaked = [...homeCacheNow].filter((entry) => !homeCacheBefore.has(entry))

  if (leaked.length > 0)
    fail(
      `the executable unpacked into the home cache instead: ${leaked.join(', ')}`
    )

  console.log(
    `the executable unpacked ${files} file(s) into ${path.join(tmpFolder, folders[0])}, not ${homeCacheDir}`
  )
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

      await checkServedViews()
      checkPkgCache()
      finish(output.slice(-TAIL_LINES))
      break
    }
  } catch {
    // not listening yet, or the connection was refused - keep waiting
  }

  await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
}

if (!passed) fail(`no answer on ${baseUrl}/SASjsApi/info after ${READY_TIMEOUT_MS / 1000}s`)
