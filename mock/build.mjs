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
import { execFileSync, execSync } from 'child_process'
import {
  existsSync,
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import {
  buildIdentity,
  demoLoginMeta,
  readDemoLogins,
  run as runInShell,
  runWhenTheRegistryIsReady,
  stampedWorker
} from './lib.mjs'
import { withCodeSources, withServerSeededFiles } from './driveSeed.mjs'
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
// 6.32.0 writes the API console to `<base>/api-console/` (sasjs/cli#1603), which is
// where the screen frames it; 6.32.1 imports the linter with the host
// (sasjs/cli#1608), without which `code/lint` and `code/format` answer 500 in every
// browser build and the Studio shows no markers at all.
//
// Pinned to the release that carries the sas-transcript support (sasjs/cli#1575),
// the drive-backed App Stream, the run times this host actually answers, the
// paint-critical script marker, and the drive's own lint rules: before 6.27.1 the
// browser host answered an empty listing by design, so the Apps screen was blank
// however the drive was seeded;
// before 6.27.2 its `/info` answer stated `['js']` while its runtime served
// `sas`; before 6.27.3 it deferred every script behind the service worker, so the
// canvas stylesheet was the only thing painted for the seconds the worker took to
// claim the page, and a stored colour choice arrived too late to matter; before
// 6.28.0 its page bridge answered a `blob` request with the body decoded as
// text, so every picture in the drive failed to render; and before 6.30.0 it
// passed the linter no configuration at all, so the Studio linted and formatted
// against @sasjs/lint's defaults and a `.sasjslint` edited on the drive changed
// nothing - the file was displayed and never read; before 6.31.0 it wrote no API
// console, so the API screen framed the application itself; and before 6.32.0 it
// wrote the console to `<base>/api/`, where this build's shell for the app's own
// route covered it, so the screen reported a build that carries no console.
// `^6` resolved to whatever 6.x npm served at build time, which could be a CLI
// that refuses the recording, one that serves no apps, or one whose run times
// hide the program this site exists to show.
// 7.2.1 includes the mock Drive upload authorization fix (sasjs/cli#1621).
// 7.2.2 carries @sasjs/api 0.44.2 (sasjs/cli#1622).
//
// 8.0.0 is the first release whose host honours the `layout` flag on the format
// route. The CLI pins the `@sasjs/api` build the worker answers `/SASjsApi` from,
// so a host assembled by anything up to 7.4.0 laid the code out whichever button
// the Studio pressed: "Fix lint issues" reformatted the file. The fix is
// `@sasjs/api` 0.44.4 (sasjs/cli#1629), and 8.0.0 is the release that carried it
// to the registry - 7.4.0 still pinned 0.44.2 and no release landed in between.
// Its breaking change, `_WEBIN_FILEREF` giving paths rather than contents, is in
// the SAS9 upload path, which no screen on this site uses.
// 8.0.9 embeds sas-language 0.7.4: earlier workers join returned macro values
// to %end and misindent them even though the packaged server uses 0.7.4.
// 10.4.1 embeds sas-language 0.8.9, preserving PARMCARDS data and marked
// delimiters in %bquote / %nrbquote when formatting in the browser host.
const CLI_VERSION = process.env.SASJS_CLI_VERSION ?? '10.4.1'

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
 * can be traced to each app's release rather than to a commit. */
const resolvedApps = await Promise.all(
  PUBLISHED_APPS.map(async (app) => await resolveRelease(app))
)
const published = await Promise.all(
  resolvedApps.map(async (app) => ({
    app,
    pack: await fetchPack(releaseUrl(app))
  }))
)
// A server seeds the drive root's `.sasjslint` at startup and the Studio tree
// shows it; the captured snapshot does not carry it, so the build puts the API's
// own rules file there rather than restating the rules in the demo's data.
const seeded = withServerSeededFiles(
  snapshot,
  readFileSync(
    path.join(root, 'api', 'src', 'utils', 'defaultLintConfiguration.json'),
    'utf8'
  )
)

/**
 * The code the demo's drive carries, at whatever is newest when the site is built.
 *
 * Nothing here is pinned: the macro core follows `@sasjs/core` on npm's `latest`
 * tag, the SAS Packages framework follows its default branch, and the apps below
 * follow their newest releases. A demo that named versions would be describing a
 * library nobody installs today - the daily rebuild exists so a release reaches
 * the site without anyone remembering to move a number.
 *
 * So the core on the drive is NOT the core this server bundles: `api/package.json`
 * pins the range that the server's own programs are written against, which may be
 * older. That is deliberate - the tree is a library to read, not the server's
 * runtime - and it is why the resolved version is recorded rather than assumed.
 *
 * `code-macro-core.txt` and `code-sas-packages.txt` sit beside `cli-version.txt`,
 * so a published tree can be traced to what built it.
 */

/** Fetches with a deadline and one retry, so a stalled host cannot hang a rebuild. */
const fetchWithRetry = async (url, { headers = {}, attempts = 2 } = {}) => {
  let lastError

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(120000)
      })

      if (!response.ok)
        throw new Error(`${response.status} ${response.statusText} for ${url}`)

      return Buffer.from(await response.arrayBuffer())
    } catch (error) {
      lastError = error
    }
  }

  throw new Error(`Could not fetch ${url}: ${lastError?.message}`)
}

const fetchSasPackages = async () => {
  const target = path.join(root, 'sasjsbuild', 'sas-packages')
  const record = path.join(root, 'sasjsbuild', 'sas-packages.txt')

  // the record as well as the tree: a build interrupted between the extraction
  // and the write leaves a tree with no version, and the site copy then fails
  if (existsSync(path.join(target, 'SPF')) && existsSync(record))
    return { target, record }

  // the default branch, whatever it points at now
  const head = JSON.parse(
    (
      await fetchWithRetry(
        'https://api.github.com/repos/yabwon/SAS_PACKAGES/commits/HEAD',
        {
          headers: process.env.GITHUB_TOKEN
            ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
            : {}
        }
      )
    ).toString('utf8')
  )

  const sha = head.sha
  const tarball = path.join(root, 'sasjsbuild', 'sas-packages.tar.gz')

  writeFileSync(
    tarball,
    await fetchWithRetry(
      `https://codeload.github.com/yabwon/SAS_PACKAGES/tar.gz/${sha}`
    )
  )

  rmSync(target, { recursive: true, force: true })
  mkdirSync(target, { recursive: true })

  // one top-level folder in the archive, named after the commit
  execFileSync('tar', ['xzf', tarball, '--strip-components=1', '-C', target], {
    cwd: root
  })

  if (!existsSync(path.join(target, 'SPF')))
    throw new Error(
      `The SAS Packages tarball did not unpack an SPF folder: expected ${path.join(target, 'SPF')}`
    )

  writeFileSync(
    record,
    `yabwon/SAS_PACKAGES ${sha} (default branch at build time)\n`
  )

  return { target, record }
}

/** The macro core, from npm's newest release of the package. */
const fetchMacroCore = () => {
  const target = path.join(root, 'sasjsbuild', 'macro-core')
  const record = path.join(root, 'sasjsbuild', 'macro-core.txt')
  const pack = path.join(root, 'sasjsbuild')

  if (existsSync(path.join(target, 'package.json')) && existsSync(record))
    return { target, record }

  // an archive from an earlier build would be picked up by the find below and
  // written to the record as this build's core, so they all go first
  for (const name of readdirSync(pack))
    if (name.startsWith('sasjs-core-') && name.endsWith('.tgz'))
      rmSync(path.join(pack, name), { force: true })

  runWhenTheRegistryIsReady(
    `npm pack @sasjs/core@latest --silent --pack-destination ${pack}`,
    { cwd: root }
  )

  const archives = readdirSync(pack).filter(
    (name) => name.startsWith('sasjs-core-') && name.endsWith('.tgz')
  )

  if (archives.length !== 1)
    throw new Error(
      `npm pack @sasjs/core@latest left ${archives.length} archives in ${pack}, expected one, so the drive would carry the wrong macro core.`
    )

  rmSync(target, { recursive: true, force: true })
  mkdirSync(target, { recursive: true })

  execFileSync(
    'tar',
    ['xzf', path.join(pack, archives[0]), '--strip-components=1', '-C', target],
    { cwd: root }
  )

  const core = JSON.parse(
    readFileSync(path.join(target, 'package.json'), 'utf8')
  )

  writeFileSync(
    record,
    `@sasjs/core ${core.version} (npm latest at build time)\n`
  )

  return { target, record }
}

const macroCore = fetchMacroCore()
const sasPackages = await fetchSasPackages()

const drive = withCodeSources(
  withPublishedApps(seeded, published, new Date().toISOString()),
  [
    // the library half of SASjs uses, and the framework the other half arrives
    // with; both are read at build time, so the site describes today
    { folder: 'macro-core', root: macroCore.target },
    {
      folder: 'sas-packages',
      root: sasPackages.target,
      // the papers and the logos: 12MB of PDFs and screenshots, and a visitor who
      // opens `/code` is there for the SAS
      skip: ['SPF/Documentation/', 'SPF/Logo/']
    }
  ]
)

writeFileSync(
  path.join(root, 'sasjsbuild', 'mock-snapshot.json'),
  JSON.stringify(drive)
)

process.stdout.write(
  `\nPublished ${published
    .map(
      ({ app, pack }) =>
        `${pack.streamServiceName ?? app.name} ${app.release}${app.resolved === false ? ' (last known, latest unreadable)' : ''}`
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

// The release this site reports as the build it came from.
//
// Every screen asks `/SASjsApi/info` what produced the build - the dashboard's
// Version line, the footer stamp, the login screen's support ticket - and the
// browser host answers `dev`, because a worker ships inside the CLI and has no
// release of its own. The site IS built from this repository, so the honest
// answer is this repository's tag, which is what `git describe` says and what a
// running server reports in the same field (see api/src/utils/buildInfo.ts).
// Nothing here names a version: the tag comes from the checkout.
const identity = buildIdentity({ cwd: root })

const workerPath = path.join(site, 'sw.js')

writeFileSync(
  workerPath,
  stampedWorker(
    readFileSync(workerPath, 'utf8'),
    { ...identity, buildDate: new Date().toISOString() },
    { cliVersion: CLI_VERSION }
  )
)

process.stdout.write(`\nThe site reports itself as ${identity.display}\n`)

// The page the API screen frames on this site. Absent, that screen frames the
// application inside itself - worse than the refusal it replaced - so a CLI that
// does not write one has to fail the build rather than the visitor.
const consolePage = path.join(site, 'api-console', 'index.html')

if (!existsSync(consolePage))
  // The absence has three causes and the message names all three: a pin that
  // predates the console, a target that turns it off, and a site that already
  // carries one of its files (the build leaves those alone and warns).
  throw new Error(
    `The mock site has no API console: expected ${consolePage}. ` +
      `Either the target sets streamConfig.mockApi: false, or the site already ` +
      `carries one of the console's four files so the build kept them (it warns ` +
      `when it does), or @sasjs/cli ${CLI_VERSION} predates the console, which ` +
      `wrote it to api/ until 6.32.0.`
  )

// GitHub Pages answers an unknown path from 404.html, and a static host cannot
// rewrite. Without this copy, a bookmark of /studio - or a reload on it -
// is a 404 instead of the app.
//
// The copy carries `<base href="/">` because the page is served from a path of
// any depth: the shell's asset references are relative, so from /docs/settings/
// `host/boot.js` would be requested as /docs/settings/host/boot.js and the app
// would never start. The root copy is left alone - it is already at the root.
//
// Both copies also carry the demo's sign-in accounts (see `readDemoLogins` in
// `lib.mjs`): a visitor arriving at the login screen has no directory to be in,
// so the credentials are part of the demo rather than something to hunt for. The
// interface shows the block only where that meta is present, which is why the
// published page - and not the web bundle - is where it belongs.
const identityPath = path.join(site, 'host', 'identity.json')

// The fixture is what the login screen lists, so a build without it publishes a
// site that offers no way in - and one CI would stay green about. Same judgement
// as the API console above: an artefact this build depends on is missing.
const demoMeta = demoLoginMeta(readDemoLogins(identityPath, CLI_VERSION))

const withDemoLogins = (html) => {
  if (!demoMeta) return html

  if (!html.includes('<head>'))
    throw new Error(
      `Could not add the demo's sign-in accounts to ${index} - the shell has no <head>`
    )

  return html.replace('<head>', `<head>${demoMeta}`)
}

const source = readFileSync(index, 'utf8')
const shell = withDemoLogins(
  source.replace('<head>', '<head><base href="/" />')
)

if (!shell.includes('<base href="/" />'))
  throw new Error(
    `Could not add a base href to ${index} - the shell has no <head>`
  )

// the root page is what a visitor lands on, and the login screen is where an
// unauthenticated one is sent: without this copy the hint would be on every
// route except the one that needs it
writeFileSync(index, withDemoLogins(source))

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

// The two libraries the drive carries under /code, at whatever they were when the
// site was built: the tree a visitor browses should be traceable the same way.
copyFileSync(macroCore.record, path.join(site, 'code-macro-core.txt'))
copyFileSync(sasPackages.record, path.join(site, 'code-sas-packages.txt'))

process.stdout.write(`\nMock site written to ${site}\n`)
