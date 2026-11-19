/**
 * Asserts what the login screen will advertise: the demo accounts the published
 * page states, and nothing when it states none.
 *
 * The risk this covers is the two halves disagreeing - a demo page whose meta the
 * interface reads as a list of accounts it cannot use, or a real deployment that
 * shows a credentials block because a stale attribute survived a copy. Both are
 * silent on a working sign-in; only the block is wrong.
 *
 * Run with `npm run test:demologin`.
 */
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { parseDemoLogins, DEMO_LOGIN_META } =
  await import('../src/utils/demoLogin.ts')

const failures = []
const check = (label, actual, expected) => {
  const left = JSON.stringify(actual)
  const right = JSON.stringify(expected)

  if (left !== right) failures.push(`${label}: ${left} !== ${right}`)
}

check('no attribute', parseDemoLogins(null), [])
check('empty attribute', parseDemoLogins(''), [])
check('not JSON', parseDemoLogins('sasjsadmin/Orion123'), [])
check('not a list', parseDemoLogins('{"username":"sasjsadmin"}'), [])

// the shape the mock build writes, as HTML would hand it over decoded
check(
  'the demo pair',
  parseDemoLogins(
    '[{"username":"sasjsadmin","password":"Orion123","admin":true},' +
      '{"username":"sasjsuser","password":"Orion123","admin":false}]'
  ),
  [
    { username: 'sasjsadmin', password: 'Orion123', admin: true },
    { username: 'sasjsuser', password: 'Orion123', admin: false }
  ]
)

// an entry that cannot sign in is not an account: no username or no password
check(
  'unusable entries are dropped',
  parseDemoLogins(
    '[{"username":"","password":"x"},{"username":"a"},{"password":"b"},null,"sasjsadmin"]'
  ),
  []
)

// `admin` is a hint, not a promise: anything but true reads as a normal account
check(
  'admin is exactly true',
  parseDemoLogins('[{"username":"u","password":"p","admin":"yes"}]'),
  [{ username: 'u', password: 'p', admin: false }]
)

check('the attribute name', DEMO_LOGIN_META, 'sasjs-demo-login')

/*
 * The two halves, joined.
 *
 * The build writes the tag and the interface reads it, and each declares the
 * attribute name - the bundle cannot import the build's module, so the name is
 * the contract between them. A rename on one side would leave every check above
 * green and quietly remove the block from the published page, so the contract is
 * asserted here: the build's constant, and the build's own tag read back by the
 * interface's parser.
 */
const { DEMO_LOGIN_META: BUILD_META, demoLoginMeta } =
  await import('../../mock/lib.mjs')

check(
  'the build and the interface agree on the attribute',
  DEMO_LOGIN_META,
  BUILD_META
)

/** The attribute decoding a browser applies, for the four characters the build escapes. */
const decodeAttribute = (value) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

const tag = demoLoginMeta([
  { username: 'sasjsadmin', password: 'Orion123', admin: true }
])
const content = /content="([^"]*)"/.exec(tag)?.[1]

check(
  'the tag the build writes is the list the interface reads',
  parseDemoLogins(decodeAttribute(content ?? '')),
  [{ username: 'sasjsadmin', password: 'Orion123', admin: true }]
)

if (failures.length) {
  console.error('FAILED:\n' + failures.join('\n'))
  process.exit(1)
}

console.log('demo login: all checks passed')
