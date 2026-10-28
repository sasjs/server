/**
 * Tests for the "what was I last in" store (web/src/utils/lastFile.ts).
 *
 * Run with `npm run test:lastfile`. A small in-memory localStorage stands in
 * for the browser's, including one that throws, because the module has to
 * survive storage being unavailable.
 */
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const memoryStorage = () => {
  const data = new Map()
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    clear: () => data.clear(),
    key: (index) => Array.from(data.keys())[index] ?? null,
    get length() {
      return data.size
    },
    _data: data
  }
}

const throwingStorage = () => ({
  getItem() {
    throw new Error('storage disabled')
  },
  setItem() {
    throw new Error('storage disabled')
  },
  removeItem() {
    throw new Error('storage disabled')
  }
})

globalThis.localStorage = memoryStorage()

const { forgetLastFile, lastFileKey, recallLastFile, rememberLastFile } =
  await import('../src/utils/lastFile.ts')

let checks = 0
const check = (label, fn) => {
  fn()
  checks++
  console.log('ok -', label)
}

check('nothing remembered means an empty path, not a crash', () => {
  localStorage.clear()
  assert.equal(recallLastFile('sysadmin'), '')
})

check('a path survives a round trip', () => {
  localStorage.clear()
  rememberLastFile('sysadmin', '/home/sysadmin/program.sas')

  assert.equal(recallLastFile('sysadmin'), '/home/sysadmin/program.sas')
})

check('users do not inherit another user file', () => {
  localStorage.clear()
  rememberLastFile('alice', '/Public/app/a.sas')
  rememberLastFile('bob', '/Public/app/b.sas')

  assert.equal(recallLastFile('alice'), '/Public/app/a.sas')
  assert.equal(recallLastFile('bob'), '/Public/app/b.sas')
})

check('the key is case- and space-insensitive, so a session spelling cannot fork it', () => {
  localStorage.clear()
  rememberLastFile('SysAdmin', '/home/sysadmin/program.sas')

  assert.equal(recallLastFile('sysadmin'), '/home/sysadmin/program.sas')
  assert.equal(lastFileKey(' SysAdmin '), lastFileKey('sysadmin'))
})

check('a blank path forgets rather than storing an empty entry', () => {
  localStorage.clear()
  rememberLastFile('sysadmin', '/home/sysadmin/program.sas')
  rememberLastFile('sysadmin', '   ')

  assert.equal(recallLastFile('sysadmin'), '')
  assert.equal(localStorage.getItem(lastFileKey('sysadmin')), null)
})

check('forgetLastFile clears it', () => {
  localStorage.clear()
  rememberLastFile('sysadmin', '/home/sysadmin/program.sas')
  forgetLastFile('sysadmin')

  assert.equal(recallLastFile('sysadmin'), '')
})

check('a hostile path is stored verbatim, not interpreted', () => {
  localStorage.clear()
  rememberLastFile('sysadmin', '/home/sysadmin/../Public/x.sas')

  // Storing is not validating: the caller checks the drive before opening it.
  assert.equal(recallLastFile('sysadmin'), '/home/sysadmin/../Public/x.sas')
})

check('storage that throws is survived', () => {
  globalThis.localStorage = throwingStorage()

  assert.equal(recallLastFile('sysadmin'), '')
  rememberLastFile('sysadmin', '/home/sysadmin/program.sas')
  forgetLastFile('sysadmin')
})

console.log(`\n${checks} last-file checks passed`)
