/**
 * Asserts who answers Ctrl+S in Studio, and that the listener does both halves of it.
 *
 * Monaco contributes Save as an editor action, so it only fires while the editor has text
 * focus. Everywhere else - the file tree, the log, the print tab, a dialog - the key reached
 * the browser, which offered to save the page instead of the buffer. `createSaveKeyHandler` is
 * the listener that covers those.
 *
 * The predicate alone is not the feature: a test of `isSaveShortcut` stays green while the
 * listener is never bound, or while it forgets to prevent the browser's own save. This drives
 * the handler that is actually bound, so both halves are pinned.
 *
 * Run with `npm run test:saveshortcut`.
 */
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { isSaveShortcut, createSaveKeyHandler, bindSaveShortcut } =
  await import('../src/containers/Studio/internal/saveShortcut.ts')

const failures = []
const check = (label, actual, expected) => {
  if (actual !== expected) failures.push(`${label}: ${actual} !== ${expected}`)
}

const key = (overrides) => ({
  key: 's',
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  ...overrides
})

// ---- the predicate ---------------------------------------------------------
check(
  'ctrl+s outside the editor',
  isSaveShortcut(key({ ctrlKey: true }), false),
  true
)
check('cmd+s on a mac', isSaveShortcut(key({ metaKey: true }), false), true)
check(
  'ctrl+S with caps lock on',
  isSaveShortcut(key({ ctrlKey: true, key: 'S' }), false),
  true
)

// inside the editor Monaco's own action runs; answering here too would save twice
check(
  'ctrl+s in the editor',
  isSaveShortcut(key({ ctrlKey: true }), true),
  false
)

check(
  'ctrl+shift+s',
  isSaveShortcut(key({ ctrlKey: true, shiftKey: true }), false),
  false
)
check(
  'ctrl+alt+s',
  isSaveShortcut(key({ ctrlKey: true, altKey: true }), false),
  false
)
check('s alone', isSaveShortcut(key({}), false), false)
check('ctrl+d', isSaveShortcut(key({ ctrlKey: true, key: 'd' }), false), false)

// ---- the handler that is bound to the document -----------------------------
/** Drive the handler as a keydown would, reporting what it did. */
const press = (handler, event) => {
  const result = { saved: 0, prevented: 0 }

  handler({
    ...event,
    preventDefault: () => {
      result.prevented++
    }
  })

  return result
}

let saves = 0
const unfocused = createSaveKeyHandler({
  save: () => {
    saves++
  },
  hasFocus: () => false
})
let state = press(unfocused, key({ ctrlKey: true }))
check('outside the editor: saves', saves, 1)
check(
  'outside the editor: stops the browser saving the page',
  state.prevented,
  1
)

saves = 0
const focused = createSaveKeyHandler({
  save: () => {
    saves++
  },
  hasFocus: () => true
})
state = press(focused, key({ ctrlKey: true }))
check('in the editor: Monaco owns it, so nothing is written twice', saves, 0)
check('in the editor: the key is left alone', state.prevented, 0)

saves = 0
state = press(unfocused, key({ ctrlKey: true, key: 'd' }))
check('another key: no save', saves, 0)
check('another key: nothing prevented', state.prevented, 0)

// the focus is read at keydown time, not captured when the handler was made
let focusedNow = false
saves = 0
const moving = createSaveKeyHandler({
  save: () => {
    saves++
  },
  hasFocus: () => focusedNow
})
press(moving, key({ ctrlKey: true }))
focusedNow = true
press(moving, key({ ctrlKey: true }))
check('focus read per keypress', saves, 1)

// ---- the binding -----------------------------------------------------------
// A listener on the document is what makes any of this reach a keypress. A stand-in
// document records the binding and can hand the handler an event back.
const standInDocument = () => {
  const listeners = new Map()

  return {
    addEventListener: (type, handler) => listeners.set(type, handler),
    removeEventListener: (type) => listeners.delete(type),
    /** What the browser would do with a keydown. */
    press: (event) => {
      const handler = listeners.get('keydown')
      if (!handler) return { bound: false }

      let prevented = 0
      handler({ ...event, preventDefault: () => prevented++ })

      return { bound: true, prevented }
    }
  }
}

saves = 0
const documentLike = standInDocument()
const unbind = bindSaveShortcut(
  documentLike,
  createSaveKeyHandler({
    save: () => {
      saves++
    },
    hasFocus: () => false
  })
)
state = documentLike.press(key({ ctrlKey: true }))
check('bound to the document', state.bound, true)
check('a bound keydown saves', saves, 1)

unbind()
state = documentLike.press(key({ ctrlKey: true }))
check('unbound with the component', state.bound, false)

if (failures.length) {
  console.error(`Save shortcut: ${failures.length} failure(s)`)
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}

console.log(
  "Save shortcut: Ctrl+S answers outside the editor, prevents the browser save, and stays out of Monaco's way"
)
