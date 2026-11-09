#!/usr/bin/env node
/**
 * Builds the demonstration site: the docs, the web bundle, and the browser host
 * around both.
 *
 * The result is an ordinary folder of static files - `sasjsbuild/mock` - whose
 * service worker answers `/SASjsApi` from `@sasjs/api`, the same package the
 * server answers with. So the site is the REAL interface with no server behind
 * it, which is the only kind of demo this project publishes.
 *
 * The CLI does the assembly (`sasjs compile` then `sasjs build` against the
 * `mock` target in sasjs/sasjsconfig.json), because the host it installs is the
 * one sasjs/cli already ships and tests. A release of that tool is meant to
 * change this site - see CLI_VERSION below for how far that follows - and the
 * version it actually used is written into the output, so a published site can
 * always be traced back to the release that assembled it.
 */
import { execSync } from 'child_process'
import {
  existsSync,
  copyFileSync,
  cpSync,
  mkdirSync,
  writeFileSync
} from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { run as runInShell, runWhenTheRegistryIsReady } from './lib.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/**
 * The CLI that assembles the site.
 *
 * A RANGE, not an exact version: the site's worker, its boot loader and the
 * `@sasjs/api` browser build inside it all come from the CLI, and every release
 * of it that fixes the host is a release this site wants without a commit here
 * saying so. A major needs a deliberate change - that is where a version string
 * is worth pinning - and the build records which release it actually used, so a
 * deploy log says what built the site rather than what the range hoped for.
 */
const CLI_VERSION = process.env.SASJS_CLI_VERSION ?? '^6'

const run = (command, cwd = root) => runInShell(command, cwd)

const sasjs = (arguments_) =>
  // quoted: `^` is an escape character to cmd.exe, and this runs on Windows too
  runWhenTheRegistryIsReady(
    `npx --yes "@sasjs/cli@${CLI_VERSION}" ${arguments_}`,
    { cwd: root }
  )

/** A command whose output is needed rather than passed through. */
const capture = (command) => execSync(command, { cwd: root, encoding: 'utf8' })

// Which CLI is about to assemble the site. Printed for the deploy log, and
// written into the output below: a range means the site is not reproducible from
// this file alone, so the artifact has to carry the answer itself.
let versionOutput = ''

try {
  versionOutput = capture(`npx --yes "@sasjs/cli@${CLI_VERSION}" --version`)
} catch (error) {
  // the build below reports a registry problem with its own retries; this is
  // only the record of which release was used
  versionOutput = String(error?.stdout ?? '')
}

process.stdout.write(versionOutput || '\n')
const cliUsed = /v(\d+\.\d+\.\d+)/.exec(versionOutput)?.[1] ?? 'unknown'

// The docs are inside the web build by construction, so the site carries the
// pages that describe the release it was built from.
run('npm run docs:build')
run('npm run build', path.join(root, 'web'))

sasjs('compile -t mock')

// The drive a visitor starts with. It is a captured snapshot - the format the
// browser host exports - so the demo opens on files rather than on an empty
// drive whose home folder does not exist.
copyFileSync(
  path.join(root, 'mock', 'drive.json'),
  path.join(root, 'sasjsbuild', 'mock-snapshot.json')
)

sasjs('build -t mock')

const site = path.join(root, 'sasjsbuild', 'mock')
const index = path.join(site, 'index.html')

if (!existsSync(index))
  throw new Error(`The mock site has no index.html: expected ${index}`)

// GitHub Pages answers an unknown path from 404.html, and a static host cannot
// rewrite. Without this copy, a bookmark of /studio - or a reload on it -
// is a 404 instead of the app.
copyFileSync(index, path.join(site, '404.html'))

// 404.html makes those paths RENDER, but as an HTTP 404: the browser logs it, a
// crawler will not follow it, and the page's own links to them read as broken.
// A folder per screen answers 200, which is the whole of what a static host can
// do about it - and it is enough, because the app is the page.
//
// The long paths are here because the browser-hosted build has no server to
// redirect them; the app answers them so that a bookmark keeps working.
for (const route of [
  'apps',
  'studio',
  'settings',
  'logon',
  'SASjsApps',
  'SASjsStudio',
  'SASjsSettings',
  'SASjsLogon'
]) {
  mkdirSync(path.join(site, route), { recursive: true })
  copyFileSync(index, path.join(site, route, 'index.html'))
}

// The API documentation page, at the short prefix the interface links to. The
// worker answers /SASjsApi from @sasjs/api, but /api is a plain file and a
// static host serves it only if the page is in the site. Copied only when the
// API has been built - the page without the swagger-ui assets beside it is a
// worse answer than the shell - so a checkout that built only the web bundle
// is unaffected.
const swagger = path.join(root, 'api', 'public', 'SASjsApi')
if (existsSync(path.join(swagger, 'swagger-ui.css'))) {
  cpSync(swagger, path.join(site, 'api'), { recursive: true })
  copyFileSync(
    path.join(root, 'api', 'public', 'swagger.yaml'),
    path.join(site, 'swagger.yaml')
  )
}

// Pages serves a .nojekyll site as-is; without it, a folder starting with an
// underscore (Monaco's, for one) is dropped by the Jekyll build.
writeFileSync(path.join(site, '.nojekyll'), '')

// The site's own record of what assembled it. `^6` follows the CLI's releases,
// so two deploys of the same commit can differ - this is how a page that
// misbehaves is traced to the release that built it rather than guessed at.
writeFileSync(
  path.join(site, 'cli-version.txt'),
  `@sasjs/cli ${cliUsed} (resolved from ${CLI_VERSION} at build time)\n`
)

process.stdout.write(`\nMock site written to ${site}\n`)
