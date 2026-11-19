#!/usr/bin/env node
/**
 * Install the newest `@sasjs/core` for a release build, and record what was
 * installed.
 *
 * Run by .github/workflows/release.yml between `npm ci` and the build. The
 * committed version stays the pin that pull requests are tested against; this
 * replaces it in the tree for this job only, so the release carries the newest
 * macros without anyone editing api/package.json first.
 *
 * Never fails the release: if npm cannot answer or the install does not work
 * out, the pinned version that `npm ci` already installed is what ships, and
 * the fallback is recorded so the release notes can say so. A release from a
 * known core is better than no release.
 *
 * Writes api/.upstream-core.json:
 *   { "version": "...", "source": "latest" | "pinned-fallback", "fallback": "..." }
 *
 * Usage: take-latest-core.mjs   (from the repository root)
 */
import { execFileSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

const API_ROOT = path.join(process.cwd(), 'api')
const RECORD_FILE = path.join(API_ROOT, '.upstream-core.json')
const PACKAGE = '@sasjs/core'

const installedVersion = () =>
  JSON.parse(
    fs.readFileSync(
      path.join(API_ROOT, 'node_modules', PACKAGE, 'package.json'),
      'utf8'
    )
  ).version

const record = (body) =>
  fs.writeFileSync(RECORD_FILE, JSON.stringify(body, null, 2) + '\n')

/**
 * The installed version, or 'unknown'.
 *
 * A failed or pruned install can leave `@sasjs/core` unreadable, which is
 * exactly the state the fallback paths run in - and a fallback that throws
 * would fail the release it exists to save.
 */
const safeInstalledVersion = () => {
  try {
    return installedVersion()
  } catch (error) {
    return 'unknown'
  }
}

const reason = (error) => (error?.message || String(error)).split('\n')[0]

/**
 * Installs `@sasjs/core@<version>` into `api/node_modules`, touching nothing
 * else.
 *
 * Running the install inside `api/` would make npm reconcile that project's
 * whole dependency tree, and with its lock out of the loop it would resolve from
 * the package.json ranges instead - a release binary carrying versions the pull
 * request never tested. `@sasjs/core` declares no dependencies of its own, so
 * installing it in a scratch directory and copying the package in is the whole
 * of what is wanted, and api/package.json, api/package-lock.json and every other
 * installed package stay exactly as `npm ci` left them.
 *
 * The swap is transactional because the fallback depends on it: the pinned copy
 * has to survive a failed install, or "releasing with the pinned version"
 * becomes a release with no core at all. The new copy is staged beside the
 * destination and only moved into place once it is complete; a rename cannot
 * replace a non-empty directory, so the working copy is moved aside first and
 * put back if the second rename does not happen.
 */
const installCore = (version) => {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'sasjs-core-'))
  const [scope, name] = PACKAGE.split('/')
  const scopeDirectory = path.join(API_ROOT, 'node_modules', scope)
  const destination = path.join(scopeDirectory, name)
  const staged = path.join(scopeDirectory, `.${name}.incoming`)
  const previous = path.join(scopeDirectory, `.${name}.previous`)

  try {
    fs.writeFileSync(
      path.join(scratch, 'package.json'),
      JSON.stringify({ name: 'sasjs-core-pick', private: true })
    )

    execFileSync(
      'npm',
      [
        'install',
        '--no-audit',
        '--no-fund',
        '--ignore-scripts',
        `${PACKAGE}@${version}`
      ],
      { cwd: scratch, stdio: 'inherit', timeout: 300000 }
    )

    const source = path.join(scratch, 'node_modules', scope, name)

    // Anything that makes the new copy unusable throws here, while the working
    // copy is untouched - `safeInstalledVersion` then still reports the pin.
    JSON.parse(fs.readFileSync(path.join(source, 'package.json'), 'utf8'))

    fs.rmSync(staged, { recursive: true, force: true })
    fs.cpSync(source, staged, { recursive: true })

    const hadWorkingCopy = fs.existsSync(destination)

    fs.rmSync(previous, { recursive: true, force: true })
    if (hadWorkingCopy) fs.renameSync(destination, previous)

    try {
      fs.renameSync(staged, destination)
    } catch (error) {
      if (hadWorkingCopy) fs.renameSync(previous, destination)
      throw error
    }

    fs.rmSync(previous, { recursive: true, force: true })
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true })
    fs.rmSync(staged, { recursive: true, force: true })
  }
}

let latest

try {
  latest = execFileSync('npm', ['view', PACKAGE, 'version'], {
    cwd: API_ROOT,
    encoding: 'utf8',
    timeout: 60000
  }).trim()
} catch (error) {
  const fallback = `npm view ${PACKAGE} version failed: ${reason(error)}`

  record({
    version: safeInstalledVersion(),
    source: 'pinned-fallback',
    fallback
  })
  console.log(
    `::warning::Could not resolve the newest ${PACKAGE}; releasing with the pinned ${safeInstalledVersion()}`
  )
  process.exit(0)
}

try {
  installCore(latest)
} catch (error) {
  const fallback = `installing ${PACKAGE}@${latest} failed: ${reason(error)}`

  record({ version: safeInstalledVersion(), source: 'pinned-fallback', fallback })
  console.log(
    `::warning::Could not install ${PACKAGE}@${latest}; releasing with the pinned ${safeInstalledVersion()}`
  )
  process.exit(0)
}

const version = installedVersion()

record({ version, source: 'latest' })
console.log(`${PACKAGE} installed at ${version} (newest upstream was ${latest})`)
