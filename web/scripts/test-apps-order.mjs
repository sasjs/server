/**
 * Asserts the detailed Apps list sorts by release time, states the time rather
 * than only the day, and keeps the reader's chosen order per user.
 *
 * Two things a reader asked of the list: "when, exactly?" and "which was last?".
 * A date alone answers neither when several apps went out the same day, and the
 * registry's own order answers nothing at all - so the ordering is asserted
 * here, and its wiring is asserted on the source, the way the layout test does:
 * node strips TypeScript but cannot evaluate JSX, so a green unit test with the
 * screen back on `entries.map` would be decoration.
 *
 * Run with `npm run test:apporder`.
 */
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

// A small in-memory localStorage stands in for the browser's, including one
// that throws, because the chosen order is remembered through it.
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

const { byReleaseTime, publishedLabel, recallOrder, rememberOrder } =
  await import('../src/utils/appOrder.ts')

const failures = []
const check = (label, actual, expected) => {
  if (actual !== expected) failures.push(`${label}: ${actual} !== ${expected}`)
}

const titled = (title, publishedAt) => ({ title, publishedAt })

const earlier = titled('zeta', '2026-11-21T08:15:00.000Z')
const later = titled('alpha', '2026-11-21T16:45:00.000Z')
const undated = titled('middle', null)

const names = (apps) => apps.map((app) => app.title).join(',')

// Newest first is the default, and it is the release time that decides, not the
// name: 'alpha' is newer than 'zeta' and leads.
check(
  'default is newest first',
  names(byReleaseTime([earlier, later])),
  'alpha,zeta'
)

check(
  'newest first, asked for',
  names(byReleaseTime([earlier, later], 'newest')),
  'alpha,zeta'
)

check(
  'oldest first',
  names(byReleaseTime([later, earlier], 'oldest')),
  'zeta,alpha'
)

// An app the registry holds no date for is undated, not the oldest release:
// leading with it would claim it is the newest thing on the server.
check(
  'undated is last, newest first',
  names(byReleaseTime([undated, earlier, later])),
  'alpha,zeta,middle'
)
check(
  'undated is last, oldest first',
  names(byReleaseTime([undated, later, earlier], 'oldest')),
  'zeta,alpha,middle'
)
check(
  'two undated apps',
  names(byReleaseTime([titled('m', null), titled('a', undefined)])),
  'a,m'
)

// A batch publish gives several apps one timestamp; the order among them must
// still be stable and readable.
const twinA = titled('beta', '2026-11-21T12:00:00.000Z')
const twinB = titled('aardvark', '2026-11-21T12:00:00.000Z')
check(
  'same release time',
  names(byReleaseTime([twinA, twinB])),
  'aardvark,beta'
)
check(
  'same release time, oldest first',
  names(byReleaseTime([twinB, twinA], 'oldest')),
  'aardvark,beta'
)

// A date the registry cannot use is treated as no date at all, rather than as
// epoch zero - which would sort it last as though it were the oldest release.
check(
  'unparseable date',
  names(byReleaseTime([titled('bad', 'not a date'), earlier])),
  'zeta,bad'
)

// The list is not mutated: sorting is a view of what the screen fetched.
const source = [earlier, later]
byReleaseTime(source, 'newest')
check('input untouched', names(source), 'zeta,alpha')

// The label states the day AND the time. Two releases on one day are two
// different releases, and the reader comparing them is asking which was second.
const morning = publishedLabel('2026-11-21T08:15:00.000Z')
const afternoon = publishedLabel('2026-11-21T16:45:00.000Z')

if (!morning.startsWith('published '))
  failures.push(`label prefix: ${morning} does not start with "published "`)
if (morning === afternoon)
  failures.push(
    `label time: ${morning} === ${afternoon} for two times on one day`
  )
if (!/\d{1,2}:\d{2}/.test(morning))
  failures.push(`label time: ${morning} carries no clock time`)

check('no date, no label', publishedLabel(null), '')
check('missing date, no label', publishedLabel(undefined), '')
check('unparseable date, no label', publishedLabel('whenever'), '')

// The chosen order is remembered per user, and read back by the seed that
// decides what the list opens in. Asserting only the write half would leave a
// key the two halves disagree on - or a dropped seed call - silently
// non-persistent.
localStorage.clear()
check(
  'nothing remembered means newest first',
  recallOrder('sysadmin'),
  'newest'
)

rememberOrder('sysadmin', 'oldest')
check('a chosen order survives', recallOrder('sysadmin'), 'oldest')

// Two accounts on one browser must not inherit each other's reading order.
check('per user', recallOrder('other'), 'newest')

// A value the module does not recognise is not an order: newest first, rather
// than whatever a hand-edited storage happens to hold.
localStorage.setItem('sasjs-apps-order:admin', 'sideways')
check('unrecognised value', recallOrder('admin'), 'newest')

// The username arrives from the session, and ' Admin ' and 'admin' are one
// person: the key is normalised on both sides or a sign-in spelling change
// loses the choice.
rememberOrder(' Admin ', 'oldest')
check('username is normalised', recallOrder('admin'), 'oldest')

// Storage that throws is not an error: the list still opens, newest first.
globalThis.localStorage = throwingStorage()
check('storage disabled, recall', recallOrder('sysadmin'), 'newest')
rememberOrder('sysadmin', 'oldest')
check('storage disabled, remember', recallOrder('sysadmin'), 'newest')

globalThis.localStorage = memoryStorage()

// ...and the screen uses the sorted entries, the dated label and the remembered
// order. Without these the unit tests above pass while the list still shows a
// bare date in the order the registry returned.
const here = path.dirname(fileURLToPath(import.meta.url))
const appSource = readFileSync(
  path.join(here, '../src/containers/Apps/index.tsx'),
  'utf8'
).replace(/\s+/g, '')
const count = (haystack, needle) => haystack.split(needle).length - 1

check(
  'the list sorts by release time',
  count(appSource, 'byReleaseTime(entries,order)'),
  1
)
check(
  'the row date is the dated label',
  count(appSource, 'publishedLabel(entry.publishedAt)'),
  1
)
check(
  'the sort control is offered',
  count(appSource, 'aria-label="Sortbyreleasetime"'),
  1
)
check(
  'the sort is remembered per user',
  count(appSource, 'rememberOrder(username,next)'),
  1
)
check(
  'the list opens in the remembered order',
  count(appSource, 'useState<ReleaseOrder>(()=>recallOrder(username))'),
  1
)

if (failures.length) {
  console.error(`Apps order: ${failures.length} failure(s)`)
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}

console.log(
  'Apps order: the detailed list reads releases newest first, undated apps last, states the time, and remembers the chosen order per user'
)
