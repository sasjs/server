#!/usr/bin/env node
/**
 * Checks that the built site is self-contained: every resource a browser
 * fetches comes from this origin.
 *
 * The docs are read offline and on air-gapped hosts as often as on the public
 * internet, and a page that calls a third party is a page that renders wrong,
 * loads slowly or leaks the reader's IP when that third party is unreachable.
 *
 * Four things are checked, across every .html and .css file in the built site:
 *
 *   A  subresources - src/href/data/poster attributes on script, link, img,
 *      iframe, source, video, audio, object and embed elements;
 *   B  stylesheets  - url() and @import in CSS, including inline <style>;
 *   C  dynamic loads - an inline script that both creates an element and names
 *      an absolute URL (`g.src = 'https://...'` in a tracker snippet is the
 *      shape this catches, where it is assembled from a variable);
 *   D  any host named anywhere in a subresource position that is not this
 *      origin.
 *
 * Absolute URLs to this same origin are allowed: the canonical link, the
 * og:image meta and the social links are not requests. Plain <a href> links to
 * other sites are also fine - a link is navigation the reader chooses, not a
 * request the page makes.
 *
 *   node scripts/check-external-calls.mjs
 *   node scripts/check-external-calls.mjs --site site --origin https://server.sasjs.io
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

// docs/scripts -> the repository root, which is where the site is built to.
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
)

const readArg = (name, fallback) => {
  const index = process.argv.indexOf(name)
  return index > -1 ? process.argv[index + 1] : fallback
}

const siteDir = path.resolve(repoRoot, readArg('--site', 'web/build/docs'))
const origin = readArg('--origin', 'https://server.sasjs.io').replace(/\/$/, '')

// Not a network request: the XML namespace of the SVG elements on every page.
const IGNORED_HOSTS = new Set(['www.w3.org'])

const SUBRESOURCES = [
  ['script', 'src'],
  ['link', 'href'],
  ['img', 'src'],
  ['iframe', 'src'],
  ['source', 'src'],
  ['video', 'poster'],
  ['audio', 'src'],
  ['object', 'data'],
  ['embed', 'src'],
  ['use', 'href']
]

const failures = []
const fail = (message) => failures.push(message)

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })

// A missing directory is a build that has not run or wrote somewhere else -
// MkDocs resolves `-d` against the config file, which is how a publish job once
// built into docs/site-docs and then scanned a path that did not exist.
if (!existsSync(siteDir)) {
  console.error(
    `No built site at ${siteDir}.\n` +
      'Build it first: node docs/scripts/mkdocs.mjs build --strict -f docs/mkdocs.yml'
  )
  process.exit(1)
}

const files = walk(siteDir)
const html = files.filter((file) => file.endsWith('.html'))
const css = files.filter((file) => file.endsWith('.css'))

if (!html.length) {
  console.error(
    `no HTML in ${siteDir} - build the site first (mkdocs build --strict)`
  )
  process.exit(1)
}

const external = (url) => {
  const match = url.match(/^(?:https?:)?\/\/([^/?#]+)/i)
  if (!match) return ''

  const host = match[1].toLowerCase()
  if (IGNORED_HOSTS.has(host)) return ''
  if (`https://${host}` === origin || `http://${host}` === origin) return ''
  if (host === 'localhost' || host.startsWith('127.0.0.1')) return ''

  return host
}

const rel = (file) => path.relative(siteDir, file)

let checked = 0

for (const file of html) {
  const text = readFileSync(file, 'utf8')

  // A - subresources, on the element's own attribute.
  for (const [tag, attr] of SUBRESOURCES) {
    const pattern = new RegExp(`<${tag}\\b[^>]*?\\s${attr}="([^"]+)"`, 'gi')
    for (const match of text.matchAll(pattern)) {
      checked++
      const host = external(match[1])
      if (host) {
        fail(
          `${rel(file)}: <${tag} ${attr}="${match[1].slice(0, 120)}"> fetches from ${host}`
        )
      }
    }
  }

  // B - url() in inline styles.
  for (const match of text.matchAll(/url\((['"]?)(https?:\/\/[^)"']+)/gi)) {
    checked++
    const host = external(match[2])
    if (host)
      fail(
        `${rel(file)}: inline style url(${match[2].slice(0, 120)}) fetches from ${host}`
      )
  }

  // C - a script that loads something dynamically. The URL is often assembled
  // from a variable, so any element creation in an inline script that also
  // contains an absolute URL is reported, whether or not this check could work
  // out what would be fetched.
  for (const match of text.matchAll(
    /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi
  )) {
    const body = match[1]
    const creates =
      /createElement\s*\(\s*['"](?:script|img|iframe|link|audio|video|object|embed)['"]/i.test(
        body
      )
    if (!creates) continue

    const absolute = [...body.matchAll(/https?:\/\/[^\s"'`)]+/gi)]
      .map((url) => url[0])
      .filter((url) => external(url))

    const detail = absolute.length ? ` (${absolute[0].slice(0, 120)})` : ''
    fail(
      `${rel(file)}: an inline script creates an element to load a resource${detail}`
    )
  }
}

for (const file of css) {
  const text = readFileSync(file, 'utf8')

  for (const match of text.matchAll(/url\((['"]?)(https?:\/\/[^)"']+)/gi)) {
    checked++
    const host = external(match[2])
    if (host)
      fail(`${rel(file)}: url(${match[2].slice(0, 120)}) fetches from ${host}`)
  }

  for (const match of text.matchAll(/@import\s+(?:url\()?\s*['"]([^'"]+)/gi)) {
    checked++
    const host = external(match[1])
    if (host)
      fail(
        `${rel(file)}: @import ${match[1].slice(0, 120)} fetches from ${host}`
      )
  }
}

console.log(
  `Checked ${checked} resource references in ${html.length} pages and ${css.length} stylesheets ` +
    `against ${origin}.`
)

if (failures.length) {
  console.error(`\n${failures.length} external call(s):`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log(
  'The site is self-contained: no resource is fetched from another origin.'
)
