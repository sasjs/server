/**
 * Asserts which URL an app is linked at: the name when one app holds it, the id
 * otherwise, and never a name that is not a path segment or that the App Stream
 * answers itself.
 *
 * Run with `npm run test:appurl`.
 */
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { appHref } = await import('../src/utils/appUrl.ts')

const failures = []
const check = (label, actual, expected) => {
  if (actual !== expected) failures.push(`${label}: ${actual} !== ${expected}`)
}

const mario = { id: 'a1', name: 'mario' }
const rock = { id: 'b2', name: 'rockroller' }

// one app, one name: the readable URL
check('unique name', appHref(mario, [mario, rock]), '/app/mario/')

// the listing is what decides uniqueness
check('alone', appHref(mario, [mario]), '/app/mario/')

// two apps that answer to one name: neither is name-addressable
const twin = { id: 'c3', name: 'mario' }
check('shared name', appHref(mario, [mario, twin]), '/app/a1/')

// Resolution is exact-match, so '/app/mario' would find the lower-case one; the
// id is used anyway because the two names are one name to a reader, and a link
// that depends on a capital is a link that gets mistyped. Two names differing
// only by case cannot both be STATED (the publish clash check is
// case-insensitive), so this only arises from labels derived from folders.
check(
  'shared, differing only by case',
  appHref(mario, [mario, { id: 'd4', name: 'Mario' }]),
  '/app/a1/'
)

// a label derived from a folder may carry a space: a label, not an address
check('space in name', appHref({ id: 'e5', name: 'Mario Kart' }, []), '/app/e5/')

// the surface's own paths answer before any app is looked up
check('reserved', appHref({ id: 'f6', name: 'apps.json' }, []), '/app/f6/')

// a name another app merely contains is not shared
check(
  'prefix only',
  appHref(mario, [mario, { id: 'g7', name: 'mario2' }]),
  '/app/mario/'
)

if (failures.length) {
  console.error('app url: ' + failures.length + ' failure(s)')
  for (const failure of failures) console.error('  ' + failure)
  process.exit(1)
}

console.log('app url: name where unique, id otherwise')
