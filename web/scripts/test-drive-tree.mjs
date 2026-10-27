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

const { ancestorPathsOf, childrenOf, parentPathOf, withLevel } = await import(
  '../src/utils/driveTree.ts'
)

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

check('withLevel replaces the named node and leaves the input untouched', () => {
  const tree = node('files', '', true, [
    node('a', '/a', true, [node('stale.sas', '/a/stale.sas', false)])
  ])

  const level = node('a', '/a', true, [node('fresh.sas', '/a/fresh.sas', false)])

  const next = withLevel(tree, '/a', level)

  assert.deepEqual(
    next.children[0].children.map((child) => child.name),
    ['fresh.sas']
  )
  // the input keeps its own (now stale) children: the graft is not in place
  assert.deepEqual(
    tree.children[0].children.map((child) => child.name),
    ['stale.sas']
  )
})

check('withLevel of the root replaces the whole tree', () => {
  const tree = node('files', '', true, [node('old', '/old', true)])
  const next = withLevel(tree, '', node('files', '', true, []))

  assert.deepEqual(next.children, [])
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

check('childrenOf gives an unloaded non-empty folder a placeholder child', () => {
  const folder = node('a', '/a', true, [], { hasChildren: true })

  const children = childrenOf(folder)

  assert.equal(children.length, 1)
  assert.equal(children[0].name, 'Loading...')
  assert.equal(children[0].relativePath, '/a::loading')
})

check('childrenOf leaves an empty folder and a loaded empty folder childless', () => {
  assert.deepEqual(childrenOf(node('empty', '/empty', true, [])), [])
  assert.deepEqual(
    childrenOf(node('empty', '/empty', true, [], { childrenLoaded: true })),
    []
  )
})

check('childrenOf never fabricates a child for a file', () => {
  assert.deepEqual(childrenOf(node('x.sas', '/x.sas', false, [])), [])
})

console.log(`\n${checks} checks passed`)
