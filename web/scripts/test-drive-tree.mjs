/**
 * Pure-function tests for the drive tree helpers the Studio browser uses to
 * load one folder level at a time.
 *
 * These are the parts that decide which paths get requested and how a fetched
 * level is grafted onto the tree, and they are testable without a browser. Run
 * with `npm run test:drivetree`.
 */
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const {
  ancestorPathsOf,
  childPrefixOf,
  childrenOf,
  expandedDescendantsOf,
  graftLevel,
  isDriveRootPath,
  isRootPath,
  parentPathOf,
  withRootPath
} = await import('../src/utils/driveTree.ts')

const node = (name, relativePath, isFolder, children = [], extra = {}) => ({
  name,
  relativePath,
  isFolder,
  children,
  ...extra
})

let checks = 0
const check = (label, fn) => {
  fn()
  checks++
  console.log('ok -', label)
}

check('ancestorPathsOf walks every folder above a file', () => {
  assert.deepEqual(ancestorPathsOf('/a/b/c.sas'), ['', '/a', '/a/b'])
})

check('ancestorPathsOf of a top level file is the root alone', () => {
  assert.deepEqual(ancestorPathsOf('/top.sas'), [''])
})

check('ancestorPathsOf of a folder excludes the folder itself', () => {
  assert.deepEqual(ancestorPathsOf('/a/b'), ['', '/a'])
})

check('parentPathOf returns the containing folder', () => {
  assert.equal(parentPathOf('/a/b'), '/a')
  assert.equal(parentPathOf('/a'), '')
})

check(
  'graftLevel replaces the named node and leaves the input untouched',
  () => {
    const tree = node('files', '', true, [
      node('a', '/a', true, [node('stale.sas', '/a/stale.sas', false)])
    ])

    const level = node('a', '/a', true, [
      node('fresh.sas', '/a/fresh.sas', false)
    ])

    const next = graftLevel(tree, '/a', level)

    assert.deepEqual(
      next.children[0].children.map((child) => child.name),
      ['fresh.sas']
    )
    // the input keeps its own (now stale) children: the graft is not in place
    assert.deepEqual(
      tree.children[0].children.map((child) => child.name),
      ['stale.sas']
    )
  }
)

check('graftLevel of the root replaces the whole tree', () => {
  const tree = node('files', '', true, [node('old', '/old', true)])
  const next = graftLevel(tree, '', node('files', '', true, []))

  assert.deepEqual(next.children, [])
})

check('graftLevel reports null when no node carries the path', () => {
  const tree = node('files', '', true, [node('a', '/a', true)])

  assert.equal(
    graftLevel(tree, '/not/in/tree', node('x', '/not/in/tree', true)),
    null
  )
})

check('childrenOf returns loaded children as they are', () => {
  const folder = node('a', '/a', true, [node('x.sas', '/a/x.sas', false)], {
    childrenLoaded: true
  })

  assert.deepEqual(
    childrenOf(folder).map((child) => child.name),
    ['x.sas']
  )
})

check(
  'childrenOf gives an unloaded non-empty folder a placeholder child',
  () => {
    const folder = node('a', '/a', true, [], { hasChildren: true })

    const children = childrenOf(folder)

    assert.equal(children.length, 1)
    assert.equal(children[0].name, 'Loading...')
    assert.equal(children[0].relativePath, '/a::loading')
  }
)

check(
  'childrenOf leaves an empty folder and a loaded empty folder childless',
  () => {
    assert.deepEqual(childrenOf(node('empty', '/empty', true, [])), [])
    assert.deepEqual(
      childrenOf(node('empty', '/empty', true, [], { childrenLoaded: true })),
      []
    )
  }
)

check('childrenOf never fabricates a child for a file', () => {
  assert.deepEqual(childrenOf(node('x.sas', '/x.sas', false, [])), [])
})

check('expandedDescendantsOf finds open folders under a refreshed one', () => {
  const expanded = ['', '/a', '/a/b', '/a/b/c', '/other', '/ab']

  // nearest first, and only real descendants of /a - '/ab' must not match
  assert.deepEqual(expandedDescendantsOf(expanded, '/a'), ['/a/b', '/a/b/c'])
})

check('expandedDescendantsOf of the root is every other open folder', () => {
  const expanded = ['', '/a', '/a/b', '/other']

  assert.deepEqual(expandedDescendantsOf(expanded, ''), [
    '/a',
    '/other',
    '/a/b'
  ])
})

check('expandedDescendantsOf of a leaf folder is empty', () => {
  assert.deepEqual(expandedDescendantsOf(['', '/a'], '/a'), [])
})

check('isDriveRootPath accepts the server spelling of the root', () => {
  assert.equal(isDriveRootPath('', true), true)
})

check('isDriveRootPath accepts the browser host spelling of the root', () => {
  // @sasjs/api answers `/` for the drive root; a tree keyed on one spelling
  // alone leaves the other node out of its expanded list
  assert.equal(isDriveRootPath('/', true), true)
})

check('isDriveRootPath is false for a folder below the root', () => {
  assert.equal(isDriveRootPath('/Public', true), false)
})

check('isDriveRootPath is false for a file, whatever its path', () => {
  assert.equal(isDriveRootPath('', false), false)
  assert.equal(isDriveRootPath('/x.sas', false), false)
})

check('isRootPath accepts either spelling of the root', () => {
  assert.equal(isRootPath(''), true)
  assert.equal(isRootPath('/'), true)
})

check(
  'isRootPath is false for a folder, a file, and a double separator',
  () => {
    assert.equal(isRootPath('/Public'), false)
    assert.equal(isRootPath('/x.sas'), false)
    assert.equal(isRootPath('//'), false)
  }
)

check('childPrefixOf gives the root children their own separator, once', () => {
  // '//' would match nothing: the root's children are '/Public', not '//Public'
  assert.equal(childPrefixOf(''), '/')
  assert.equal(childPrefixOf('/'), '/')
  assert.equal(childPrefixOf('/Public'), '/Public/')
})

check('expandedDescendantsOf works for a tree whose root says /', () => {
  // what the browser host's tree looks like before the root is keyed ROOT_PATH
  const expanded = ['/', '/Public', '/Public/app', '/Other']

  assert.deepEqual(expandedDescendantsOf(expanded, '/'), [
    '/Public',
    '/Other',
    '/Public/app'
  ])
})

check('withRootPath keys the browser host root the way the screen asks', () => {
  // graftLevel compares by exact equality, so a root at '/' is a tree nothing
  // grafts onto: ROOT_PATH is what every caller passes
  assert.equal(withRootPath(node('files', '/', true)).relativePath, '')

  // and nothing else is rewritten - the folders under the root already agree
  assert.equal(
    withRootPath(node('Public', '/Public', true)).relativePath,
    '/Public'
  )

  // a file is never the root, whatever its path
  assert.equal(withRootPath(node('x.sas', '/', false)).relativePath, '/')
})

console.log(`\n${checks} checks passed`)
