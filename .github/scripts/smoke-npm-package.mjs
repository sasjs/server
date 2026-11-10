// Boots the npm package - installed the way a user installs it - and waits for
// its API to answer.
//
// `@sasjs/server@6.0.0` shipped unable to start: `build/src/utils/zipped.js`
// required `adm-zip`, which was in devDependencies. Every test in the repository
// passed, because tests run where devDependencies are installed, and the release
// job checked the tarball's file LIST without ever running it. The executables
// are built by `pkg` and bundle their tree, so they never showed the fault either:
// this is the only shape where a missing runtime dependency is fatal.
//
// So the check is the whole journey a user takes: pack the staged directory,
// install the tarball into an empty project with `--omit=dev`, spawn the entry
// point, and wait for the API to answer. Anything that prevents the process from
// reaching its first request - a missing module, a bad build path, a broken
// require cycle - fails here.
//
// Desktop mode is deliberate: no database, no SAS, no login, so the only inputs
// are the package and a spare port.
//
// usage: node .github/scripts/smoke-npm-package.mjs <staged-dir>
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

const READY_TIMEOUT_MS = 120_000
const POLL_INTERVAL_MS = 500
const TAIL_LINES = 25

const staged = process.argv[2]

if (!staged) {
  console.error('smoke-npm-package: expected the staged package directory')
  process.exit(1)
}

const stagedManifest = JSON.parse(
  fs.readFileSync(path.join(staged, 'package.json'), 'utf8')
)

const packageName = stagedManifest.name
const entry = stagedManifest.bin ?? 'build/src/server.js'

if (!packageName) {
  console.error('smoke-npm-package: the staged manifest has no name')
  process.exit(1)
}

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options
  })

  if (result.status !== 0) {
    console.error(
      `smoke-npm-package: '${command} ${args.join(' ')}' failed\n${result.stdout ?? ''}${result.stderr ?? ''}`
    )
    process.exit(1)
  }

  return result.stdout ?? ''
}

const freePort = async () =>
  new Promise((resolve, reject) => {
    const server = net.createServer()

    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()

      server.close(() => resolve(port))
    })
  })

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'smoke-npm-package-'))

try {
  // 1. the artefact as it will be published
  const packed = run('npm', ['pack', '--silent', '--pack-destination', temp], {
    cwd: staged
  })
    .trim()
    .split('\n')
    .pop()

  const tarball = path.join(temp, packed)

  if (!fs.existsSync(tarball)) {
    console.error(`smoke-npm-package: npm pack produced no tarball (${packed})`)
    process.exit(1)
  }

  // 2. a clean project that depends on it and nothing else
  const consumer = path.join(temp, 'consumer')

  fs.mkdirSync(consumer)
  fs.writeFileSync(
    path.join(consumer, 'package.json'),
    JSON.stringify({ name: 'smoke-consumer', private: true, version: '0.0.0' })
  )

  run(
    'npm',
    [
      'install',
      tarball,
      '--omit=dev',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--loglevel=error'
    ],
    { cwd: consumer }
  )

  // 3. the entry point, booted as the package's own `start:prod` does
  const entryPath = path.join(consumer, 'node_modules', packageName, entry)

  if (!fs.existsSync(entryPath)) {
    console.error(
      `smoke-npm-package: ${packageName}/${entry} is missing after install`
    )
    process.exit(1)
  }

  const port = await freePort()

  const child = spawn(process.execPath, [entryPath], {
    cwd: consumer,
    env: {
      ...process.env,
      MODE: 'desktop',
      HTTP_PORT: String(port),
      HTTPS_PORT: '',
      NODE_ENV: 'production'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  })

  const output = []

  const capture = (chunk) => {
    output.push(String(chunk))

    if (output.length > 200) output.shift()
  }

  child.stdout.on('data', capture)
  child.stderr.on('data', capture)

  let exited = false

  child.on('exit', () => {
    exited = true
  })

  const deadline = Date.now() + READY_TIMEOUT_MS
  let ready = false

  while (Date.now() < deadline && !exited) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/SASjsApi/info`)

      if (response.ok) {
        ready = true
        break
      }
    } catch (_) {
      // not listening yet
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }

  child.kill('SIGTERM')

  if (!ready) {
    console.error(
      `smoke-npm-package: ${packageName}@${stagedManifest.version} did not answer on port ${port}`
    )
    console.error(output.join('').split('\n').slice(-TAIL_LINES).join('\n'))
    process.exit(1)
  }

  console.log(
    `smoke-npm-package: ${packageName}@${stagedManifest.version} installed with --omit=dev and answered /SASjsApi/info on port ${port}`
  )
} finally {
  fs.rmSync(temp, { recursive: true, force: true })
}
