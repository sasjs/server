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
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync
} from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { run as runInShell, runWhenTheRegistryIsReady } from './lib.mjs'
import {
  fetchPack,
  withPublishedApps,
  PUBLISHED_APPS,
  releaseUrl,
  resolveRelease
} from './apps.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/**
 * The CLI that assembles the site.
 *
 * An EXACT version, not a range: the site's worker, its boot loader, the page
 * bridge and the `@sasjs/api` browser build inside it all come from the CLI, so
 * a new release can change what a visitor sees without a commit here. That is
 * the reason to pin - the build is reproducible from this file, and a host fix
 * reaches the site when this number moves, in a commit that says which fix.
 * `SASJS_CLI_VERSION` still overrides it for a one-off build.
 */
// Pinned to the release that carries the sas-transcript support (sasjs/cli#1575),
// the drive-backed App Stream, the run times this host actually answers, and the
// paint-critical script marker: before 6.27.1 the browser host answered an empty
// listing by design, so the Apps screen was blank however the drive was seeded;
// before 6.27.2 its `/info` answer stated `['js']` while its runtime served
// `sas`; before 6.27.3 it deferred every script behind the service worker, so the
// canvas stylesheet was the only thing painted for the seconds the worker took to
// claim the page, and a stored colour choice arrived too late to matter; and
// before 6.28.0 its page bridge answered a `blob` request with the body decoded as
// text, so every picture in the drive failed to render.
// `^6` resolved to whatever 6.x npm served at build time, which could be a CLI
// that refuses the recording, one that serves no apps, or one whose run times
// hide the program this site exists to show.
const CLI_VERSION = process.env.SASJS_CLI_VERSION ?? '6.28.0'

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
//
// The snapshot is ALSO how the site publishes its apps: a whole drive replaces the
// seed in the host, so each packaged app's files and the registry entry that lists
// them have to be in this one file. `apps.mjs` owns that - which apps, what it
// reads from each release, where the entries land, and the shape of the index.
const snapshot = JSON.parse(
  readFileSync(path.join(root, 'mock', 'drive.json'), 'utf8')
)
/* `latest` is resolved first: what a rebuild publishes is whatever each repository
 * calls its newest release at that moment, and the tag is logged below so the site
 * can be traced to three releases rather than to a commit. */
const resolvedApps = await Promise.all(
  PUBLISHED_APPS.map(async (app) => await resolveRelease(app))
)
const published = await Promise.all(
  resolvedApps.map(async (app) => ({
    app,
    pack: await fetchPack(releaseUrl(app))
  }))
)
const drive = withPublishedApps(snapshot, published, new Date().toISOString())

writeFileSync(
  path.join(root, 'sasjsbuild', 'mock-snapshot.json'),
  JSON.stringify(drive)
)

process.stdout.write(
  `\nPublished ${published
    .map(
      ({ app, pack }) =>
        `${pack.streamServiceName} ${app.release}${app.resolved === false ? ' (last known, latest unreadable)' : ''}`
    )
    .join(', ')} to the demo drive` +
    ` (${Object.keys(drive.files).length} files)\n`
)

// A recorded SAS session, so a Run on the demo's .sas program shows a real log,
// listing and webout instead of a refusal. A browser has no SAS binary; this is
// the transcript of one run, with the licensee and site line removed.
//
// Only a CLI carrying the support reads it (sasjs/cli#1575 reads the file; the
// pinned CLI_VERSION above is well past it), and SASJS_CLI_VERSION overrides the
// pin for a one-off build. A CLI that predates it leaves the file travelling with
// the build unread, and the demo refuses the program - which is why the README
// describes the behaviour only where the recording applies.
copyFileSync(
  path.join(root, 'mock', 'sas-transcript.json'),
  path.join(root, 'sasjsbuild', 'sas-transcript.json')
)

sasjs('build -t mock')

const site = path.join(root, 'sasjsbuild', 'mock')
const index = path.join(site, 'index.html')

if (!existsSync(index))
  throw new Error(`The mock site has no index.html: expected ${index}`)

// GitHub Pages answers an unknown path from 404.html, and a static host cannot
// rewrite. Without this copy, a bookmark of /studio - or a reload on it -
// is a 404 instead of the app.
//
// The copy carries `<base href="/">` because the page is served from a path of
// any depth: the shell's asset references are relative, so from /docs/settings/
// `host/boot.js` would be requested as /docs/settings/host/boot.js and the app
// would never start. The root copy is left alone - it is already at the root.
const shell = readFileSync(index, 'utf8').replace(
  '<head>',
  '<head><base href="/" />'
)

if (!shell.includes('<base href="/" />'))
  throw new Error(
    `Could not add a base href to ${index} - the shell has no <head>`
  )

writeFileSync(path.join(site, '404.html'), shell)

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
  writeFileSync(path.join(site, route, 'index.html'), shell)
}

// The API documentation page, at the path the interface frames. Swagger UI's
// stylesheet, bundle and preset are GENERATED from swagger-ui-dist and
// gitignored - api/public/SASjsApi holds only what is committed - so the build
// asks the API for them first. That needs the API's own install; without it the
// copy cannot run, and the error below says what to do rather than letting
// ts-node's absence surface as a mystery.
//
// The whole folder goes to /api-assets, page included, and its references are
// relative: the page and the files it needs travel together, and /api itself is
// the app's route - the screen that frames this.
const swaggerSource = path.join(root, 'api', 'public', 'SASjsApi')
const apiPage = 'api-assets'
const swaggerFiles = [
  'index.html',
  'swagger-ui-init.js',
  'swagger-ui.css',
  'swagger-ui-bundle.js',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'oauth2-redirect.html',
  'swagger-ui-LICENSE',
  'swagger-ui-NOTICE'
]

if (
  !existsSync(path.join(swaggerSource, 'swagger-ui.css')) &&
  existsSync(path.join(root, 'api', 'node_modules', '.bin', 'ts-node'))
)
  run('npm run swagger-ui:copy', path.join(root, 'api'))

const missing = swaggerFiles.filter(
  (file) => !existsSync(path.join(swaggerSource, file))
)

if (missing.length)
  throw new Error(
    `The API documentation page is incomplete: ${missing.join(', ')} missing from ${swaggerSource}. Run "npm ci --prefix api" and build again.`
  )

mkdirSync(path.join(site, apiPage), { recursive: true })

for (const file of swaggerFiles)
  copyFileSync(path.join(swaggerSource, file), path.join(site, apiPage, file))

copyFileSync(
  path.join(root, 'api', 'public', 'swagger.yaml'),
  path.join(site, 'swagger.yaml')
)

// The operations the interface's search box offers, written from the spec the
// page serves - one small JSON rather than a YAML parser in the browser bundle.
run(
  `node ${path.join(root, 'api', 'scripts', 'writeOperations.mjs')} ${path.join(site, 'api-operations.json')}`
)

// The documentation's own paths are the app's routes now (/docs/<page>), so each
// one needs a folder holding the app shell: the frame asks for
// /documentation/<page>, and the reader's address is the same page under /docs.
// Written from the built site, so a page added to the docs needs no list here.
const docsSite = path.join(site, 'documentation')

const documentationRoutes = []
const collectDocRoutes = (folder, prefix) => {
  for (const entry of readdirSync(folder)) {
    const source = path.join(folder, entry)

    if (statSync(source).isDirectory())
      collectDocRoutes(source, `${prefix}${entry}/`)
    else if (entry === 'index.html') documentationRoutes.push(prefix)
  }
}

if (existsSync(docsSite)) collectDocRoutes(docsSite, '')

for (const route of [
  'api',
  ...documentationRoutes.map((path) => `docs/${path}`.replace(/\/$/, ''))
]) {
  const folder = path.join(site, route)

  mkdirSync(folder, { recursive: true })
  writeFileSync(path.join(folder, 'index.html'), shell)
}

// A path that names a file is an asset request, not a route - so the folders
// above are all that the build writes.
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
