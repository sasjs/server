/**
 * Pure-function tests for the guard that stops a mouse gesture pasting.
 *
 * The guard is three listeners and a clock, so it is driven here through a stub
 * node rather than a browser: what matters is which press arms it and whether
 * the paste that follows is cancelled. Run with `npm run test:mousepaste`.
 */
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { guardMousePaste, MOUSE_PASTE_WINDOW_MS } =
  await import('../src/containers/Studio/internal/mousePasteGuard.ts')

let checks = 0
const check = (label, fn) => {
  fn()
  checks++
  console.log('ok -', label)
}

/** A node that records its listeners, so the guard can be driven by hand. */
const stubNode = () => {
  const listeners = new Map()

  return {
    listeners,
    node: {
      addEventListener: (type, listener) => listeners.set(type, listener),
      removeEventListener: (type, listener) => {
        if (listeners.get(type) === listener) listeners.delete(type)
      }
    },
    press: (button) => listeners.get('mousedown')({ button }),
    paste: () => {
      const event = {
        cancelled: false,
        stopped: false,
        preventDefault() {
          this.cancelled = true
        },
        stopPropagation() {
          this.stopped = true
        }
      }

      listeners.get('paste')(event)

      return event
    }
  }
}

const clock = (() => {
  const realNow = Date.now
  let now = 0

  return {
    advance: (ms) => (now += ms),
    install: () => {
      Date.now = () => now
    },
    restore: () => {
      Date.now = realNow
    }
  }
})()

clock.install()

check('a middle press drops the paste that follows', () => {
  const stub = stubNode()
  guardMousePaste(stub.node)

  stub.press(1)
  const event = stub.paste()

  assert.equal(event.cancelled, true)
  assert.equal(event.stopped, true)
})

check('a right press drops the paste that follows', () => {
  const stub = stubNode()
  guardMousePaste(stub.node)

  stub.press(2)

  assert.equal(stub.paste().cancelled, true)
})

check('a left press leaves the paste alone', () => {
  const stub = stubNode()
  guardMousePaste(stub.node)

  // Clicking into the code, then Ctrl+V: the paste is the user's.
  stub.press(0)

  assert.equal(stub.paste().cancelled, false)
})

check('a press older than the window leaves the paste alone', () => {
  const stub = stubNode()
  guardMousePaste(stub.node)

  stub.press(2)
  clock.advance(MOUSE_PASTE_WINDOW_MS + 1)

  assert.equal(stub.paste().cancelled, false)
})

check('one press arms one paste', () => {
  const stub = stubNode()
  guardMousePaste(stub.node)

  stub.press(2)
  assert.equal(stub.paste().cancelled, true)
  // The press has been spent: a keyboard paste afterwards is the user's.
  assert.equal(stub.paste().cancelled, false)
})

check('the release detaches both listeners', () => {
  const stub = stubNode()
  const release = guardMousePaste(stub.node)

  release()

  assert.equal(stub.listeners.has('mousedown'), false)
  assert.equal(stub.listeners.has('paste'), false)
})

clock.restore()

console.log(`\n${checks} checks passed`)
