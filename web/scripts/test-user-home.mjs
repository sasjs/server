/**
 * Pure-function tests for the user-home path helpers (web/src/utils/userHome.ts).
 *
 * These decide where a freshly opened Studio buffer is created. Run with
 * `npm run test:userhome`.
 */
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const {
  USER_HOME_ROOT,
  DEFAULT_PROGRAM_NAME,
  homeFilePathFor,
  homeFolderFor,
  isUserHomePath,
  safeSegment
} = await import('../src/utils/userHome.ts')

let checks = 0
const check = (label, fn) => {
  fn()
  checks++
  console.log('ok -', label)
}

check('every user gets one home folder', () => {
  assert.equal(USER_HOME_ROOT, '/home')
  assert.equal(homeFolderFor('sysadmin'), '/home/sysadmin')
  assert.equal(homeFilePathFor('sysadmin'), '/home/sysadmin/program.sas')
  assert.equal(DEFAULT_PROGRAM_NAME, 'program.sas')
})

check('the path is stable, so a reload lands on the same file', () => {
  assert.equal(homeFilePathFor('sysadmin'), homeFilePathFor('sysadmin'))
  // Nothing time- or session-dependent in the name.
  assert.ok(!/\d{8}-/.test(homeFilePathFor('sysadmin')))
})

check('different users do not share a program', () => {
  assert.notEqual(homeFilePathFor('alice'), homeFilePathFor('bob'))
})

check('a username cannot escape its own folder', () => {
  for (const hostile of ['../../etc', 'a/b', '..', '', '   ', 'a\\b']) {
    const folder = homeFolderFor(hostile)

    assert.ok(folder.startsWith(`${USER_HOME_ROOT}/`))
    assert.equal(folder.split('/').length, 3)
    assert.ok(!folder.includes('..'))
    assert.ok(!folder.includes('\\'))
  }
})

check('safeSegment keeps ordinary names intact', () => {
  assert.equal(safeSegment('sysadmin'), 'sysadmin')
  assert.equal(safeSegment('First.Last'), 'first.last')
  assert.equal(safeSegment('a b'), 'a-b')
  assert.equal(safeSegment('..'), 'anonymous')
  assert.equal(safeSegment('', 'fallback'), 'fallback')
})

check('isUserHomePath recognises the home area only', () => {
  assert.ok(isUserHomePath('/home'))
  assert.ok(isUserHomePath('/home/sysadmin/program.sas'))
  assert.ok(!isUserHomePath('/Public/app/x.sas'))
  assert.ok(!isUserHomePath('/homely/x.sas'))
  assert.ok(!isUserHomePath(''))
})

console.log(`\n${checks} user-home checks passed`)
