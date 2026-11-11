#!/usr/bin/env node
/**
 * Checks that this site still describes the server release it documents.
 *
 * Run it before a release, or in CI on every pull request. Four checks, all
 * hard facts rather than judgement calls:
 *
 *   A  coverage  - every page in docs/ is in the nav, and every nav entry names
 *                  a page that exists. Without it a page can be written and
 *                  never reachable, or deleted while the nav still links it.
 *   B  endpoints - every `/SASjsApi/...` path a page mentions is registered by
 *                  the server source at the pinned ref, and where the page also
 *                  names the method, that method is registered too. This is the
 *                  check that catches a renamed endpoint (a page promising
 *                  `/SASjsApi/drive/file` after the route became
 *                  `/SASjsApi/drive/fileTree`) or an endpoint that was removed.
 *                  It does not check the other direction: a route with no page
 *                  is not automatically a documentation gap, and the false
 *                  positives train people to ignore the check.
 *   C  settings  - every environment variable given a `### NAME` section under
 *                  "Environment Variables" in settings.md is read by the server
 *                  source. A variable the server no longer reads is a setting
 *                  a reader will set and expect to work.
 *   D  spec      - docs/pages/swagger.yaml, which the API page renders, is byte for
 *                  byte the specification the release ships at
 *                  api/public/swagger.yaml. The published reference cannot
 *                  describe a different set of endpoints from the release.
 *
 * A page may name a path or a variable it does not own - a planned endpoint on
 * the roadmap, another tool's URL quoted in an example. Those are declared in
 * an HTML comment, which is stripped before the scan:
 *
 *   <!-- server-docs-ignore: /SASjsApi/auth/viyaclientid -->
 *   <!-- server-docs-ignore: SAS_OPTIONS SASV9_OPTIONS -->
 *
 * The server is read from a checkout: a shallow clone of the release tag named
 * by --server-ref (or SERVER_DOCS_REF), which may also be `latest` - the newest
 * published vX.Y.Z tag, resolved from the repository's tags. Point --server-src
 * at a local checkout to check against work in progress instead:
 *
 *   node scripts/check-server-docs.mjs --server-ref latest
 *   node scripts/check-server-docs.mjs --server-ref v3.9.0
 *   node scripts/check-server-docs.mjs --server-src ../server
 */

import { execFileSync, spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

// The documentation lives inside the server repository, so this file sits at
// docs/scripts and the tree it describes is two levels up.
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
)

const readArg = (name, fallback) => {
  const index = process.argv.indexOf(name)
  return index > -1 ? process.argv[index + 1] : fallback
}

const requestedRef = readArg(
  '--server-ref',
  process.env.SERVER_DOCS_REF || 'main'
)
const docsDir = path.join(repoRoot, readArg('--docs', 'docs/pages'))
const navFile = path.join(repoRoot, readArg('--nav', 'docs/mkdocs.yml'))
const specFile = path.join(docsDir, 'swagger.yaml')

const failures = []
const fail = (message) => failures.push(message)

const run = (command, args, options = {}) =>
  execFileSync(command, args, { encoding: 'utf8', stdio: 'pipe', ...options })

// ------------------------------------------------------------------ the server

/** `latest` means the newest published release, resolved from the tags rather
 * than from the GitHub API: `git ls-remote` needs no token, has no rate limit,
 * and reports what a clone would find. A ref that is not `latest` is used as
 * given, so a branch name and a tag both work. */
const resolveLatestTag = () => {
  const output = run('git', [
    'ls-remote',
    '--tags',
    '--refs',
    'https://github.com/sasjs/server'
  ])

  const tags = output
    .split('\n')
    .map((line) => line.split('refs/tags/')[1])
    .filter(Boolean)
    .map((tag) => ({
      tag,
      version: tag
        .replace(/^v/, '')
        .split('.')
        .map((part) => parseInt(part, 10))
    }))
    .filter(
      (entry) =>
        entry.version.length === 3 && entry.version.every((n) => !isNaN(n))
    )

  tags.sort(
    (a, b) =>
      b.version[0] - a.version[0] ||
      b.version[1] - a.version[1] ||
      b.version[2] - a.version[2]
  )

  return tags.length ? tags[0].tag : ''
}

const serverRef = requestedRef === 'latest' ? resolveLatestTag() : requestedRef

if (!serverRef) {
  console.error(
    'could not resolve --server-ref latest: no vX.Y.Z tags found on sasjs/server'
  )
  process.exit(1)
}

if (serverRef !== requestedRef) {
  console.log(`--server-ref latest resolved to ${serverRef}`)
}

// The server source this checkout carries is the one the pages are meant to
// describe, so a bare run reads it and needs no clone and no network. Asking
// for a published ref still clones it, which is how the public site is checked
// against the release it documents.
const askedForRef =
  process.argv.includes('--server-ref') || Boolean(process.env.SERVER_DOCS_REF)

let serverRoot = readArg('--server-src', '')
let tempServer = ''
let serverLabel = serverRef

if (!serverRoot && !askedForRef) {
  serverRoot = repoRoot
  serverLabel = repoRoot
  console.log(`Reading the server source from ${serverRoot}`)
}

if (serverRoot) {
  serverRoot = path.resolve(serverRoot)
  serverLabel = serverRoot
  console.log(`Reading the server source from ${serverRoot}`)
} else {
  tempServer = mkdtempSync(path.join(tmpdir(), 'server-docs-check-'))
  serverRoot = path.join(tempServer, 'server')
  console.log(`Cloning sasjs/server@${serverRef} ...`)
  run('git', [
    'clone',
    '--quiet',
    '--depth',
    '1',
    '--branch',
    serverRef,
    'https://github.com/sasjs/server',
    serverRoot
  ])
}

const apiSrc = path.join(serverRoot, 'api', 'src')

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })

const sourceFiles = walk(apiSrc).filter(
  (file) => file.endsWith('.ts') && !file.endsWith('.spec.ts')
)
const sourceText = sourceFiles
  .map((file) => `\n// ${file}\n${readFileSync(file, 'utf8')}`)
  .join('\n')

// -------------------------------------------------------------- the endpoints

/** Every (method, path) the server registers under /SASjsApi, built from the
 * routers themselves: api/index.ts mounts a router on a prefix, and the router
 * file declares the paths under it.
 *
 * The mounts are read from the table the router is built from (`API_MOUNTS`), not
 * from a run of `router.use(` calls - the calls became data, and a scan that still
 * looked for them found nothing, which reported every endpoint mention in the docs
 * as unregistered. A read that finds no mounts is a failure on its own, so a layout
 * change cannot turn this check into a solid block of false findings again. */
const serverRoutes = () => {
  const routes = []
  const base = '/SASjsApi'
  const indexPath = path.join(apiSrc, 'routes', 'api', 'index.ts')
  if (!existsSync(indexPath)) {
    fail(
      `routes: ${indexPath} does not exist - the router layout changed, update ` +
        'serverRoutes() in scripts/check-server-docs.mjs'
    )
    return routes
  }
  const index = readFileSync(indexPath, 'utf8')
  const dir = path.dirname(indexPath)

  const mounts = new Map()
  for (const [, name, file] of index.matchAll(
    /import\s+(\w+)\s+from\s+'\.\/([\w-]+)'/g
  )) {
    mounts.set(name, path.join(dir, `${file}.ts`))
  }

  // The mounts are the entries of the `API_MOUNTS` array: one object literal each,
  // read as a block and then asked for its two fields. Field order cannot matter
  // that way, and an entry that is missing one is reported rather than dropped -
  // a short read here would show up as endpoints the docs mention and the server
  // "does not register", which is the wrong direction to be wrong in.
  const declared = (() => {
    // anchored on the declaration, not on the name: the type annotation beside it
    // (`ApiMount[]`) carries a bracket of its own, and starting from that one reads
    // a slice of the interface instead of the array
    const declaration = index.match(/export const API_MOUNTS[^=]*=\s*\[/)
    if (!declaration) return []

    const open = declaration.index + declaration[0].length - 1

    // the array literal ends at its own bracket, so nothing after it is read
    let depth = 0
    let end = open
    for (; end < index.length; end++) {
      if (index[end] === '[') depth++
      else if (index[end] === ']' && --depth === 0) break
    }

    return Array.from(
      index.slice(open, end).matchAll(/\{[^{}]*\}/g),
      ([block]) => block
    )
  })()

  if (!declared.length) {
    fail(
      `routes: no mounts read from ${indexPath} - the table it builds the router ` +
        'from changed shape, update serverRoutes() in docs/scripts/check-server-docs.mjs'
    )
    return routes
  }

  const table = []
  const unread = []
  for (const block of declared) {
    const prefix = block.match(/path:\s*'([^']+)'/)
    const router = block.match(/router:\s*(\w+)/)
    if (prefix && router) table.push({ prefix: prefix[1], router: router[1] })
    else unread.push(block.replace(/\s+/g, ' ').trim())
  }

  if (unread.length) {
    fail(
      `routes: ${unread.length} mount(s) in ${indexPath} could not be read - each ` +
        'entry needs `path` and `router`: ' +
        unread.join(' | ')
    )
  }

  for (const { prefix, router } of table) {
    const file = mounts.get(router)
    if (!file) {
      fail(`routes: ${router} is mounted at "${prefix}" but not imported`)
      continue
    }

    const source = readFileSync(file, 'utf8')
    const mountedAt = `${base}${prefix === '/' ? '' : prefix}`
    for (const [, method, routePath] of source.matchAll(
      /\w+Router\.(get|post|put|patch|delete)\(\s*\n?\s*'([^']*)'/g
    )) {
      const full = `${mountedAt}${routePath === '/' ? '' : routePath}`
      routes.push({ method, path: full || base })
    }
  }

  return routes
}

/** `{sessionId}` in the spec, `:sessionId` in Express, `$SESSION_ID` in a shell
 * example - all one parameter. Case is folded because Express matches routes
 * case-insensitively by default, and so does a real request. A trailing slash
 * or `/*` is a prefix: a page that writes `/SASjsApi/session/` or
 * `/SASjsApi/auth/*` means the family. */
const normalisePath = (raw) => {
  const withoutQuery = raw.split('?')[0]
  const prefix =
    withoutQuery.length > 1 &&
    (withoutQuery.endsWith('/') || withoutQuery.endsWith('/*'))
  const normalised = withoutQuery
    .replace(/\{[^}]*\}/g, '*')
    .replace(/:[A-Za-z0-9_]+/g, '*')
    .replace(/\$[A-Za-z0-9_]+/g, '*')
    .replace(/[.,;:)`'"]+$/, '')
    .replace(/\/\*$/, '')
    .replace(/\/$/, '')
    .toLowerCase()

  return { path: normalised, prefix }
}

const routes = serverRoutes()

const routeMatches = ({ path: wanted, prefix }, method) =>
  routes.filter((route) => {
    const candidate = normalisePath(route.path).path
    const pathOk = prefix ? candidate.startsWith(wanted) : candidate === wanted
    return pathOk && (!method || route.method === method)
  })

// The pages

const mkdocs = readFileSync(navFile, 'utf8')
const navPages = []
for (const line of mkdocs.split('\n')) {
  const entry = line.match(/^\s*- [^:]+: (.+\.md)\s*$/)
  if (entry) navPages.push(path.basename(entry[1].trim()))
}

const docFiles = readdirSync(docsDir)
  .filter((file) => file.endsWith('.md'))
  .sort()

// A page may be deliberately unpublished - kept in the repository, absent from
// the nav - by declaring itself so at the top.
const unlisted = new Set(
  docFiles.filter((file) =>
    /<!--\s*server-docs-unlisted\b/.test(
      readFileSync(path.join(docsDir, file), 'utf8')
    )
  )
)

// A - coverage, in both directions.
for (const page of navPages) {
  if (!docFiles.includes(page)) {
    fail(`nav: ${page} is in mkdocs.yml but does not exist in docs/`)
  }
}
for (const file of docFiles) {
  if (!navPages.includes(file) && !unlisted.has(file)) {
    fail(
      `nav: docs/${file} is not in the nav, so it is unreachable. Add it, or ` +
        'declare it with a <!-- server-docs-unlisted: ... --> comment.'
    )
  }
}

// B - endpoints, and the ignores each page declares.
const ignoredPaths = []
let endpointMentions = 0

for (const file of docFiles) {
  const markdown = readFileSync(path.join(docsDir, file), 'utf8')

  const ignoredOnPage = new Set()
  for (const comment of markdown.matchAll(
    /<!--\s*server-docs-ignore:\s*([^>]*?)-->/g
  )) {
    for (const token of comment[1].trim().split(/\s+/)) {
      if (!token) continue
      ignoredOnPage.add(token)
      ignoredPaths.push(`${file}: ${token}`)
    }
  }

  const body = markdown.replace(/<!--[\s\S]*?-->/g, '')

  // A mention is a /SASjsApi path, optionally preceded by its method. The path
  // stops at whitespace, a quote or the punctuation a table cell or sentence
  // uses to end it.
  for (const match of body.matchAll(
    /(?:(GET|POST|PUT|PATCH|DELETE)\s+)?`?(\/SASjsApi[^\s`'"|)]*)/gi
  )) {
    const method = match[1] ? match[1].toLowerCase() : ''
    const raw = match[2]
    const trimmed = raw.replace(/[.,;:)`'"]+$/, '')
    // `/SASjsApi` on its own is the API root - the Swagger page, not a route.
    if (!raw || trimmed === '/SASjsApi') continue
    if (ignoredOnPage.has(raw) || ignoredOnPage.has(trimmed)) {
      continue
    }

    endpointMentions++
    const wanted = normalisePath(raw)
    if (!routeMatches(wanted, method).length) {
      // Only the routes that share the mention's first two segments are worth
      // listing; the rest is noise in a message read in a CI log.
      const family = wanted.path.split('/').slice(0, 4).join('/')
      const near = routes
        .map((route) => `${route.method.toUpperCase()} ${route.path}`)
        .filter((line) => line.toLowerCase().includes(family))
        .sort()

      fail(
        `${file}: mentions ${method ? `${method.toUpperCase()} ` : ''}${raw}, which ` +
          `the server at ${serverLabel} does not register.` +
          (near.length
            ? ` Nearby: ${near.join(', ')}`
            : ` ${routes.length} routes are registered; none under ${family}.`)
      )
    }
  }
}

// C - the documented settings must be settings the server reads.
const settingsFile = path.join(docsDir, 'settings.md')
const settings = readFileSync(settingsFile, 'utf8').split('\n')
const documentedSettings = []
let inSettingsSection = false
let ignoredSettings = new Set()

for (const comment of settings
  .join('\n')
  .matchAll(/<!--\s*server-docs-ignore:\s*([^>]*?)-->/g)) {
  for (const token of comment[1].trim().split(/\s+/)) ignoredSettings.add(token)
}

for (const line of settings) {
  if (/^## Environment Variables\s*$/.test(line)) {
    inSettingsSection = true
    continue
  }
  if (inSettingsSection && /^## /.test(line)) inSettingsSection = false

  const heading = line.match(/^###\s+([A-Z][A-Z0-9_]+)\s*$/)
  if (inSettingsSection && heading) documentedSettings.push(heading[1])
}

for (const name of documentedSettings) {
  if (ignoredSettings.has(name)) continue
  if (!new RegExp(`\\b${name}\\b`).test(sourceText)) {
    fail(
      `settings.md: documents ${name}, which the server at ${serverLabel} never reads. ` +
        'Remove the section, or declare it in a server-docs-ignore comment if it is planned.'
    )
  }
}

// D - the rendered spec is the release's spec.
const checkSpec = () => {
  const shipped = path.join(serverRoot, 'api', 'public', 'swagger.yaml')
  const lines = (file) =>
    readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n')
  const local = lines(specFile)
  const theirs = lines(shipped)

  if (local.join('\n') === theirs.join('\n')) return

  const first = local.findIndex((line, index) => line !== theirs[index])
  fail(
    `swagger.yaml: docs/pages/swagger.yaml is not the specification at ${serverLabel} ` +
      `(first difference on line ${first + 1}):\n` +
      `      docs:   ${JSON.stringify(local[first])}\n` +
      `      server: ${JSON.stringify(theirs[first])}\n` +
      `      Refresh it with:  cp <server>/api/public/swagger.yaml docs/pages/swagger.yaml`
  )
}

checkSpec()

// ------------------------------------------------------------------- the result

if (tempServer) rmSync(tempServer, { recursive: true, force: true })

console.log(
  `Checked ${docFiles.length} pages, ${navPages.length} nav entries, ` +
    `${routes.length} registered routes, ${endpointMentions} endpoint mentions, ` +
    `${documentedSettings.length} documented settings, and the API specification.`
)

if (ignoredPaths.length) {
  console.log(
    `Ignored on request (${ignoredPaths.length}): ${ignoredPaths.join(', ')}`
  )
}

if (failures.length) {
  console.error(`\n${failures.length} problem(s):`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log(`The docs match the server at ${serverLabel}.`)
