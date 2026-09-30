/**
 * Asserts the Studio settings store: defaults, persistence, and the
 * type-safe merge that ignores junk.
 *
 * The module touches localStorage, so it runs against a minimal stub.
 * Run with `npm run test:settings`.
 */
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

// A localStorage just good enough for the store: the real one is never
// available under node, and the module only needs getItem and setItem.
const backing = new Map()
globalThis.localStorage = {
  getItem: (key) => backing.get(key) ?? null,
  setItem: (key, value) => void backing.set(key, String(value)),
  removeItem: (key) => void backing.delete(key)
}

const { SETTINGS_STORAGE_KEY, defaultSettings, readSettings, writeSetting } =
  await import('../src/containers/Studio/internal/settings.ts')

const failures = []
const check = (label, condition) => {
  if (!condition) failures.push(label)
}

check(
  'the store key names its surface',
  SETTINGS_STORAGE_KEY === 'studio-settings'
)
check(
  'format on save defaults to on',
  defaultSettings['editor.formatOnSave'] === true
)

let settings = readSettings()
check(
  'a fresh store reads the defaults',
  settings['editor.formatOnSave'] === true
)

writeSetting('editor.formatOnSave', false)
settings = readSettings()
check(
  'a written setting survives a read',
  settings['editor.formatOnSave'] === false
)

writeSetting('editor.formatOnSave', true)
settings = readSettings()
check(
  'a setting can be turned back on',
  settings['editor.formatOnSave'] === true
)

// A corrupt store must not break the editor: settings are convenience.
backing.set(SETTINGS_STORAGE_KEY, '{not json')
settings = readSettings()
check(
  'a corrupt store falls back to the defaults',
  settings['editor.formatOnSave'] === true
)

// Junk values for known keys are ignored rather than adopted.
backing.set(
  SETTINGS_STORAGE_KEY,
  JSON.stringify({ 'editor.formatOnSave': 'yes please' })
)
settings = readSettings()
check(
  'a value of the wrong type is ignored',
  settings['editor.formatOnSave'] === true
)

if (failures.length) {
  console.error(`settings store: ${failures.length} check(s) failed`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('settings store: all checks passed')
