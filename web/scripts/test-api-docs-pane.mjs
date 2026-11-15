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

const { apiHost, apiDocsTarget, consoleAbsent, consolePresent } = await load()
const { expiredReason, mirroredReason } = await import('../src/utils/frame.ts')

await check('a server page frames the server path it was given', () => {
  withPage()
  assert.equal(apiHost(), 'server')
  assert.equal(apiDocsTarget(SERVER_PATH).url, SERVER_PATH)
})

await check(
  'the sasjs-host tag makes it a browser, whatever the worker says',
  () => {
    withPage({ statedHost: 'browser' })
    assert.equal(apiHost(), 'browser')
  }
)

await check('a console at the origin root resolves to /api-console/', () => {
  withPage({ statedHost: 'browser', worker: 'https://host.test/sw.js' })
  assert.equal(apiDocsTarget(SERVER_PATH).url, '/api-console/')
})

await check(
  'a site published in a folder keeps it, from the worker it registered',
  () => {
    withPage({ statedHost: 'browser', worker: 'https://host.test/demo/sw.js' })
    assert.equal(apiDocsTarget(SERVER_PATH).url, '/demo/api-console/')
  }
)

await check('a deeper folder is kept whole', () => {
  withPage({
    statedHost: 'browser',
    worker: 'https://host.test/a/b/sw.js?v=1'
  })
  assert.equal(apiDocsTarget(SERVER_PATH).url, '/a/b/api-console/')
})

await check('no controller means the root is the only answer', () => {
  withPage({ statedHost: 'browser' })
  assert.equal(apiDocsTarget(SERVER_PATH).url, '/api-console/')
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
    assert.equal(apiDocsTarget(SERVER_PATH).url, '/api-console/')
  }
)

await check('a page with no document at all reads as a server', () => {
  delete globalThis.document
  assert.equal(apiDocsTarget(SERVER_PATH).url, SERVER_PATH)
})

await check('a console the build wrote is there', async () => {
  withPage({ statedHost: 'browser', worker: 'https://host.test/sw.js' })
  globalThis.fetch = async () => ({ status: 200 })
  const { url, fromWorker } = apiDocsTarget(SERVER_PATH)
  assert.equal(await consolePresent(url, fromWorker), true)
})

await check('a build that left the console out is named as such', async () => {
  withPage({ statedHost: 'browser', worker: 'https://host.test/sw.js' })
  globalThis.fetch = async () => ({ status: 404 })
  const { url, fromWorker } = apiDocsTarget(SERVER_PATH)
  assert.equal(await consolePresent(url, fromWorker), false)
})

await check(
  'a 404 at a guessed address says nothing about the site',
  async () => {
    // a first visit reaches the pane before the worker claims the page, so the
    // address is the origin root - and a 404 there is a path this site never had
    withPage({ statedHost: 'browser' })
    const asked = []
    globalThis.fetch = async (url) => {
      asked.push(url)
      return { status: 404 }
    }
    const target = apiDocsTarget(SERVER_PATH)
    assert.equal(target.fromWorker, false)
    assert.equal(target.url, '/api-console/')
    assert.equal(await consolePresent(target.url, target.fromWorker), true)
    assert.deepEqual(asked, [])
  }
)

await check('a page that is unreachable is not called missing', async () => {
  // a proxy's 500 and a request that never leaves both leave the frame to report
  // what it finds: "this build carries no console" would send the reader away
  withPage({ statedHost: 'browser', worker: 'https://host.test/sw.js' })
  const { url, fromWorker } = apiDocsTarget(SERVER_PATH)
  globalThis.fetch = async () => ({ status: 502 })
  assert.equal(await consolePresent(url, fromWorker), true)

  globalThis.fetch = async () => {
    throw new Error('network')
  }
  assert.equal(await consolePresent(url, fromWorker), true)
})

await check('only a missing page, from a trusted address, is absent', () => {
  assert.equal(consoleAbsent(404, true), true)
  assert.equal(consoleAbsent(410, true), true)
  assert.equal(consoleAbsent(404, false), false)
  assert.equal(consoleAbsent(500, true), false)
  assert.equal(consoleAbsent(200, true), false)
})

await check('a console the build left out is not called a slow proxy', () => {
  // the timer fires ten seconds after mount, by which time the probe has said the
  // page was never written; the absent verdict has to survive it
  assert.equal(expiredReason(false, true), 'absent')
  assert.equal(expiredReason(true, true), 'absent')
})

await check('an empty frame after the wait is the page not arriving', () => {
  assert.equal(expiredReason(false, false), 'unavailable')
})

await check('a frame that loaded reports nothing', () => {
  assert.equal(expiredReason(true, false), null)
})

await check('a verdict the caller withdraws stops covering the frame', () => {
  // the first probe is provisional: it runs before the site's worker controls the
  // page, so a later one can find the console and must put the frame back
  assert.equal(mirroredReason(true, null), 'absent')
  assert.equal(mirroredReason(true, 'unavailable'), 'absent')
  assert.equal(mirroredReason(false, 'absent'), null)
  assert.equal(mirroredReason(false, 'unavailable'), 'unavailable')
  assert.equal(mirroredReason(false, null), null)
})

await check('the pane reads that decision on its timer', () => {
  const pane = fs.readFileSync(
    path.join(here, '..', 'src', 'components', 'framedPane.tsx'),
    'utf8'
  )
  assert.ok(pane.includes('expiredReason(loadedRef.current, absent)'))
  assert.ok(pane.includes('mirroredReason(absent, current)'))
})

await check('the pane is told when the build carries no console', () => {
  const container = fs.readFileSync(
    path.join(here, '..', 'src', 'containers', 'ApiDocs', 'index.tsx'),
    'utf8'
  )
  assert.ok(container.includes('consolePresent(next.url, next.fromWorker)'))
  assert.ok(container.includes("'controllerchange'"))
  assert.ok(container.includes('absent={absent}'))
})

await check('the pane frames the address the helper works out', () => {
  // the selector is what this file tests; the container only has to use it
  const container = fs.readFileSync(
    path.join(here, '..', 'src', 'containers', 'ApiDocs', 'index.tsx'),
    'utf8'
  )
  // tokens, not a spelling: the container must use the helper and know the host
  assert.ok(container.includes('apiDocsTarget(API_PANE)'))
  assert.ok(container.includes("apiHost() === 'browser'"))
})

console.log(`\n${checks} api-docs pane checks passed`)
