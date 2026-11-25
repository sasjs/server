/**
 * Asserts the shortcut that asks for the diff, and that it works everywhere.
 *
 * Unlike Save there is no Monaco action to share the key with, so this binding
 * is the only path: it must answer with focus in the editor as well as outside
 * it, and it must stop the browser's own Ctrl+Shift+D.
 *
 * Run with `npm run test:changesshortcut`.
 */
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { isChangesShortcut, createChangesKeyHandler, bindChangesShortcut } =
  await import('../src/containers/Studio/internal/changesShortcut.ts')

const key = (overrides) => ({
  key: 'd',
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  ...overrides
})

// Ctrl+Shift+D, and Cmd+Shift+D on a Mac.
assert.equal(isChangesShortcut(key({ ctrlKey: true, shiftKey: true })), true)
assert.equal(isChangesShortcut(key({ metaKey: true, shiftKey: true })), true)
assert.equal(
  isChangesShortcut(key({ ctrlKey: true, shiftKey: true, key: 'D' })),
  true,
  'caps lock does not change the key'
)

// Ctrl+D is the editor's add-next-occurrence, and Ctrl+Alt+D and plain D are
// other things entirely.
assert.equal(isChangesShortcut(key({ ctrlKey: true })), false)
assert.equal(
  isChangesShortcut(key({ ctrlKey: true, shiftKey: true, altKey: true })),
  false
)
assert.equal(isChangesShortcut(key({ shiftKey: true })), false)
assert.equal(isChangesShortcut(key({})), false)
assert.equal(
  isChangesShortcut(key({ ctrlKey: true, shiftKey: true, key: 's' })),
  false
)

// The handler does both halves: it shows the changes, and it stops the browser
// opening its own Ctrl+Shift+D over the app.
let shows = 0
let prevented = 0
const handler = createChangesKeyHandler({
  showChanges: () => shows++
})
handler({
  ...key({ ctrlKey: true, shiftKey: true }),
  preventDefault: () => prevented++
})
assert.equal(shows, 1)
assert.equal(prevented, 1)

shows = 0
prevented = 0
handler({ ...key({ ctrlKey: true }), preventDefault: () => prevented++ })
assert.equal(shows, 0, 'another key shows nothing')
assert.equal(prevented, 0, 'another key is left alone')

// A listener on the document is what makes any of this reach a keypress, and
// the unbind has to remove it.
const standInDocument = () => {
  const listeners = new Map()

  return {
    addEventListener: (type, fn) => listeners.set(type, fn),
    removeEventListener: (type) => listeners.delete(type),
    press: (event) => {
      const bound = listeners.get('keydown')
      if (!bound) return { bound: false }

      let stopped = 0
      bound({ ...event, preventDefault: () => stopped++ })

      return { bound: true, stopped }
    }
  }
}

shows = 0
const documentLike = standInDocument()
const unbind = bindChangesShortcut(
  documentLike,
  createChangesKeyHandler({ showChanges: () => shows++ })
)
let result = documentLike.press(key({ ctrlKey: true, shiftKey: true }))
assert.equal(result.bound, true)
assert.equal(shows, 1)

unbind()
result = documentLike.press(key({ ctrlKey: true, shiftKey: true }))
assert.equal(result.bound, false, 'unbound with the component')

console.log(
  'Changes shortcut: Ctrl+Shift+D shows the diff from anywhere and stays out of the browser'
)
