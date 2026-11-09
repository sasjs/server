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
 * one sasjs/cli already ships and tests. Its version is pinned here rather than
 * left to `latest`: the site is built from a known CLI, so a release of that
 * tool cannot change this site without a commit saying so.
 */
import { execSync } from 'child_process'
import { existsSync, copyFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/**
 * The CLI that assembles the site.
 *
 * Keep this exact: the site's worker, its boot loader and the `@sasjs/api`
 * browser build inside it all come from this release. Bump it deliberately, with
 * the mock site rebuilt and looked at.
 */
const CLI_VERSION = process.env.SASJS_CLI_VERSION ?? '6.13.3'

const run = (command, cwd = root) => {
  process.stdout.write(`\n> ${command}\n`)

  execSync(command, { cwd, stdio: 'inherit' })
}

const sasjs = (arguments_) =>
  run(`npx --yes @sasjs/cli@${CLI_VERSION} ${arguments_}`)

// The docs are inside the web build by construction, so the site carries the
// pages that describe the release it was built from.
run('npm run docs:build')
run('npm run build', path.join(root, 'web'))

sasjs('compile -t mock')

// The drive a visitor starts with. It is a captured snapshot - the format the
// browser host exports - so the demo opens on files rather than on an empty
// drive whose home folder does not exist.
copyFileSync(path.join(root, 'mock', 'drive.json'), path.join(root, 'sasjsbuild', 'mock-snapshot.json'))

sasjs('build -t mock')

const site = path.join(root, 'sasjsbuild', 'mock')
const index = path.join(site, 'index.html')

if (!existsSync(index))
  throw new Error(`The mock site has no index.html: expected ${index}`)

// GitHub Pages answers an unknown path from 404.html, and a static host cannot
// rewrite. Without this copy, a bookmark of /SASjsStudio - or a reload on it -
// is a 404 instead of the app.
copyFileSync(index, path.join(site, '404.html'))

// Pages serves a .nojekyll site as-is; without it, a folder starting with an
// underscore (Monaco's, for one) is dropped by the Jekyll build.
writeFileSync(path.join(site, '.nojekyll'), '')

process.stdout.write(`\nMock site written to ${site}\n`)
