/**
 * Asserts how the permission rules are read as app access: which rules count as
 * an app's own, how a user and a group rule land in different columns, and that
 * a rule on `/AppStream` is not mistaken for one app's.
 *
 * Run with `npm run test:appgrants`.
 */
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { groupAppGrants } = await import('../src/containers/Admin/appGrants.ts')

const failures = []
const check = (label, condition) => {
  if (!condition) failures.push(label)
}

const userRule = (path, username, setting = 'Grant') => ({
  uid: `${path}-${username}`,
  path,
  type: 'Route',
  setting,
  user: { uid: 'u1', username, displayName: username, isAdmin: false }
})
const groupRule = (path, name, setting = 'Grant') => ({
  uid: `${path}-${name}`,
  path,
  type: 'Route',
  setting,
  group: { id: 'g1', name }
})

const grants = groupAppGrants([
  userRule('/AppStream/mario', 'alice'),
  userRule('/AppStream/mario', 'bob'),
  groupRule('/AppStream/mario', 'analysts'),
  userRule('/AppStream/rockroller', 'alice'),
  userRule('/AppStream/rockroller', 'eve', 'Deny'),
  userRule('/SASjsApi/code/execute', 'alice'),
  userRule('/AppStream', 'alice')
])

check('two apps are reported', grants.length === 2)
check(
  'apps are listed by what the rule names',
  grants.map((grant) => grant.key).join(',') === 'mario,rockroller'
)

// An app's id is what its rule names now, and a label is what an older rule
// names; the gate honours both, so a read-only view must report both rather
// than deciding one of them is not an app grant.
const streamedId = '0a0b0c0d-1111-4111-8111-121212121212'
const byId = groupAppGrants([userRule(`/AppStream/${streamedId}`, 'alice')])
check(
  'a rule on an id is one app',
  byId.length === 1 && byId[0].key === streamedId
)

const mario = grants.find((grant) => grant.key === 'mario')
check('user grants are collected', mario.users.join(',') === 'alice,bob')
check('group grants are collected', mario.groups.join(',') === 'analysts')
check('an app with no deny has none', mario.denied.length === 0)

const rock = grants.find((grant) => grant.key === 'rockroller')
check('a deny is separated from the grants', rock.denied.join(',') === 'eve')
check('a deny is not counted as a grant', rock.users.join(',') === 'alice')

check(
  'a rule on the stream itself is not one app',
  grants.every((grant) => grant.key !== 'AppStream')
)
check(
  'a non-app route is ignored',
  !grants.some((grant) => grant.key.includes('SASjsApi'))
)
check(
  'a nested path is not an app name',
  groupAppGrants([userRule('/AppStream/mario/services/x', 'alice')]).length ===
    0
)
check('no rules is no apps', groupAppGrants([]).length === 0)

if (failures.length) {
  console.error(`app grants: ${failures.length} check(s) failed`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('app grants: all checks passed')
