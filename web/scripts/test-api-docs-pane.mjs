/**
 * Tests for the API documentation pane's address (web/src/utils/host.ts).
 *
 * Run with `npm run test:apidocs`. A server serves Swagger UI at its own path. A
 * browser host has no server: its build writes an API console beside the site, and
 * the folder is the one its worker is registered under - the only statement of the
 * base the page carries at runtime.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { registerHooks } from 'node:module'
import { fileURLToPath } from 'node:url'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const here = path.dirname(fileURLToPath(import.meta.url))
const SERVER_PATH = '/api-assets/'

/**
 * A page as the two kinds of deployment present it.
 *
 * `statedHost` is the `sasjs-host` tag the mock build writes; `worker` is the
 * controller's script URL, which the build writes as `<base>/sw.js`.
 */
const withPage = ({ statedHost, worker } = {}) => {
  globalThis.document = {
    querySelector(selector) {
      if (/meta\[name=["']sasjs-host["']\]/.test(selector))
        return statedHost === undefined
          ? null
          : { getAttribute: () => statedHost }
      return null
    }
  }

  const controller = worker === undefined ? null : { scriptURL: worker }
  Object.defineProperty(globalThis, 'navigator', {
    value: { serviceWorker: { controller } },
    configurable: true
  })
}

const load = async () => await import('../src/utils/host.ts')

let checks = 0
const check = async (label, fn) => {
  await fn()
  checks++
  console.log('ok -', label)
}

const { apiHost, apiDocsUrl } = await load()

await check('a server page frames the server path it was given', () => {
  withPage()
  assert.equal(apiHost(), 'server')
  assert.equal(apiDocsUrl(SERVER_PATH), SERVER_PATH)
})

await check(
  'the sasjs-host tag makes it a browser, whatever the worker says',
  () => {
    withPage({ statedHost: 'browser' })
    assert.equal(apiHost(), 'browser')
  }
)

await check('a console at the origin root resolves to /api/', () => {
  withPage({ statedHost: 'browser', worker: 'https://host.test/sw.js' })
  assert.equal(apiDocsUrl(SERVER_PATH), '/api/')
})

await check(
  'a site published in a folder keeps it, from the worker it registered',
  () => {
    withPage({ statedHost: 'browser', worker: 'https://host.test/demo/sw.js' })
    assert.equal(apiDocsUrl(SERVER_PATH), '/demo/api/')
  }
)

await check('a deeper folder is kept whole', () => {
  withPage({
    statedHost: 'browser',
    worker: 'https://host.test/a/b/sw.js?v=1'
  })
  assert.equal(apiDocsUrl(SERVER_PATH), '/a/b/api/')
})

await check('no controller means the root is the only answer', () => {
  withPage({ statedHost: 'browser' })
  assert.equal(apiDocsUrl(SERVER_PATH), '/api/')
})

await check(
  'a browser page with no navigator resolves rather than throwing',
  () => {
    // the tag is what makes it a browser, so this is the only shape that reaches
    // the navigator guard: without the tag the host reads as a server and the
    // guard is never asked
    withPage({ statedHost: 'browser' })
    delete globalThis.navigator
    assert.equal(apiHost(), 'browser')
    assert.equal(apiDocsUrl(SERVER_PATH), '/api/')
  }
)

await check('a page with no document at all reads as a server', () => {
  delete globalThis.document
  assert.equal(apiDocsUrl(SERVER_PATH), SERVER_PATH)
})

await check('the pane frames the address the helper works out', () => {
  // the selector is what this file tests; the container only has to use it
  const container = fs.readFileSync(
    path.join(here, '..', 'src', 'containers', 'ApiDocs', 'index.tsx'),
    'utf8'
  )
  // tokens, not a spelling: the container must use the helper and know the host
  assert.ok(container.includes('apiDocsUrl(API_PANE)'))
  assert.ok(container.includes("apiHost() === 'browser'"))
})

console.log(`\n${checks} api-docs pane checks passed`)
