/**
 * Asserts what the folder page says about the level it is showing.
 *
 * The numbers on that page are derived from the tree's own answer - a count, a
 * total, the newest date, the crumbs - so they are pure functions of
 * a level and are asserted here rather than through a render. The page's wiring is
 * in `test-folder-view-browser.mjs`.
 *
 * The case worth naming: the drive's tree reports no size. A summary that treated
 * a missing size as zero would print "0 B" under a folder of logs, which is worse
 * than printing nothing - so the total is asserted to be absent rather than small,
 * and a partial total is asserted to be absent too.
 *
 * Run with `npm run test:folderview`.
 */
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const {
  breadcrumbOf,
  folderStats,
  formatBytes,
  formatWhen,
  inFolderOrder,
  totalBytes
} = await import('../src/utils/folderView.ts')

let checks = 0
const check = (label, fn) => {
  fn()
  checks += 1
}

const node = (name, path, isFolder, extra = {}) => ({
  name,
  relativePath: path,
  isFolder,
  children: [],
  ...extra
})

// --- the summary --------------------------------------------------------------

const level = [
  node('macro', '/demo/macro', true),
  node('orders.sas', '/demo/orders.sas', false, {
    modified: '2026-11-02T10:00:00.000Z',
    created: '2026-10-01T09:00:00.000Z'
  }),
  node('run.sas', '/demo/run.sas', false, {
    modified: '2026-11-05T08:30:00.000Z',
    created: '2026-10-02T09:00:00.000Z'
  })
]

check('the level is counted, folders apart from files', () =>
  assert.deepEqual(
    (({ files, folders }) => ({ files, folders }))(folderStats(level)),
    { files: 2, folders: 1 }
  )
)

// the newest change is the later of the two dates a file carries, and folders
// carry none at all
check('the newest date in the level', () =>
  assert.equal(folderStats(level).newest, '2026-11-05T08:30:00.000Z')
)

check('a level with no dates has no newest date', () =>
  assert.equal(folderStats([node('a', '/a', true)]).newest, null)
)

// A date the host reported badly is not a date: it is left out rather than
// sorting as the string "Invalid Date"
check('an unparseable date is ignored', () =>
  assert.equal(
    folderStats([node('a.sas', '/a.sas', false, { modified: 'not a date' })])
      .newest,
    null
  )
)

// --- sizes --------------------------------------------------------------------

check('no sizes reported means no total, not zero', () =>
  assert.equal(totalBytes(level), null)
)

const sized = [
  node('a.sas', '/demo/a.sas', false, { size: 1024 }),
  node('b.sas', '/demo/b.sas', false, { size: 512 }),
  node('macro', '/demo/macro', true)
]
check('a total is the sum of the files', () =>
  assert.equal(totalBytes(sized), 1536)
)

// one file without a size makes the total a partial sum, which is not the
// folder's size - so there is no total
check('one unknown size withholds the total', () =>
  assert.equal(
    totalBytes([...sized, node('c.sas', '/demo/c.sas', false)]),
    null
  )
)

check('an empty folder totals zero, which is a fact', () =>
  assert.equal(totalBytes([]), 0)
)

// --- how a size reads ---------------------------------------------------------

check('bytes', () => assert.equal(formatBytes(512), '512 B'))
check('kilobytes, one decimal', () => assert.equal(formatBytes(1536), '1.5 KB'))
check('megabytes', () => assert.equal(formatBytes(5 * 1024 * 1024), '5 MB'))
check('a round number keeps no decimal point', () =>
  assert.equal(formatBytes(1024), '1 KB')
)
check('gigabytes', () => assert.equal(formatBytes(3 * 1024 ** 3), '3 GB'))
check('a nonsense size prints nothing', () => assert.equal(formatBytes(-1), ''))

// --- how a date reads ---------------------------------------------------------

check('a reported date is a local string', () =>
  assert.ok(formatWhen('2026-11-05T08:30:00.000Z').length > 0)
)
check('a missing date is empty, not a dash', () =>
  assert.equal(formatWhen(undefined), '')
)
check('an unparseable date is empty', () =>
  assert.equal(formatWhen('nope'), '')
)

// --- where the reader is ------------------------------------------------------

check('the drive is the first crumb', () =>
  assert.deepEqual(breadcrumbOf('/Public/demo'), [
    { name: 'files', path: '' },
    { name: 'Public', path: '/Public' },
    { name: 'demo', path: '/Public/demo' }
  ])
)
check('the root is one crumb', () =>
  assert.deepEqual(breadcrumbOf(''), [{ name: 'files', path: '' }])
)
// the host answers the root as '/' as well as '', and the crumbs are the same
check('the root in its other spelling', () =>
  assert.deepEqual(breadcrumbOf('/'), [{ name: 'files', path: '' }])
)

// --- the order ----------------------------------------------------------------

// the drive answers folders first, and the page must not depend on that: a level
// in creation order would put a folder in the middle of the files
check('folders first, then names', () =>
  assert.deepEqual(
    inFolderOrder([
      node('b.sas', '/b.sas', false),
      node('z', '/z', true),
      node('a.sas', '/a.sas', false),
      node('c', '/c', true)
    ]).map((child) => child.name),
    ['c', 'z', 'a.sas', 'b.sas']
  )
)
check('sorting does not mutate the level', () => {
  const given = [node('b.sas', '/b.sas', false), node('a', '/a', true)]

  inFolderOrder(given)

  assert.equal(given[0].name, 'b.sas')
})

console.log(`\n${checks} checks passed`)
