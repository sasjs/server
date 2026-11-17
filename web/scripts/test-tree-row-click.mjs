/**
 * Pure-function tests for the rule that a click anywhere in a drive-tree row
 * opens that row's entry.
 *
 * The bug these pin: the handler used to sit on the label, so a click on the
 * row's left edge - the indent and the empty icon column - reached nothing, and
 * a file looked unopenable until the reader happened to click further right.
 * Run with `npm run test:treerow`.
 */
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { rowClickOpensEntry } = await import('../src/components/treeRowClick.ts')

const ICON_CONTAINER = 'MuiTreeItem-iconContainer'

let checks = 0
const check = (label, fn) => {
  fn()
  checks++
  console.log('ok -', label)
}

/**
 * A stub element: it knows the classes it carries, its parent, and answers
 * `closest` the way the DOM does (self first, then upwards).
 */
const element = (classes = [], parent = null) => {
  const node = {
    classes,
    parent,
    closest(selector) {
      let current = node
      while (current) {
        if (selector === '[role="treeitem"]' && current.role === 'treeitem')
          return current
        if (
          selector.startsWith('.') &&
          current.classes.includes(selector.slice(1))
        )
          return current
        current = current.parent
      }
      return null
    }
  }
  return node
}

const row = (children = []) => {
  const node = element(['MuiTreeItem-content'])
  node.role = 'treeitem'
  for (const child of children) child.parent = node
  return node
}

// the parts of one file row, in the order the DOM nests them
const fileRow = () => {
  const label = element(['MuiTreeItem-label'])
  const name = element(['MuiTypography-root'], label)
  const icon = element(['MuiSvgIcon-root'], name)
  const iconColumn = element([ICON_CONTAINER], row())
  const parent = row([iconColumn, label])
  iconColumn.parent = parent
  label.parent = parent
  const indent = element(['MuiTreeItem-content'], parent)

  return { parent, indent, iconColumn, label, name, icon }
}

check('a click on the name opens the file', () => {
  const { parent, name } = fileRow()

  assert.equal(rowClickOpensEntry(name, parent, ICON_CONTAINER), true)
})

check('a click on the icon opens the file', () => {
  const { parent, icon } = fileRow()

  assert.equal(rowClickOpensEntry(icon, parent, ICON_CONTAINER), true)
})

check('a click on the empty icon column opens the file', () => {
  // the bug: this is the column a file never fills, and it used to be dead
  const { parent, iconColumn } = fileRow()

  assert.equal(rowClickOpensEntry(iconColumn, parent, ICON_CONTAINER), true)
})

check('a click on the indent, before the column, opens the file', () => {
  const { parent, indent } = fileRow()

  assert.equal(rowClickOpensEntry(indent, parent, ICON_CONTAINER), true)
})

check('a click on a folder chevron is the tree control, not the folder', () => {
  const chevron = fileRow()
  const svg = element(['MuiSvgIcon-root'], chevron.iconColumn)

  assert.equal(rowClickOpensEntry(svg, chevron.parent, ICON_CONTAINER), false)
})

check('a click in a child row does not open the parent', () => {
  const parentRow = row()
  const child = row()
  const childName = element(['MuiTypography-root'], child)

  assert.equal(
    rowClickOpensEntry(childName, parentRow, ICON_CONTAINER),
    false,
    'a nested row bubbles through its parent, and only its own row answers'
  )
})

check('a click whose target is the row itself opens it', () => {
  // the li's own box is the row, so a click on it is a click on the entry
  const { parent } = fileRow()

  assert.equal(rowClickOpensEntry(parent, parent, ICON_CONTAINER), true)
})

check('no target or no row is not an open', () => {
  const { parent } = fileRow()

  assert.equal(rowClickOpensEntry(null, parent, ICON_CONTAINER), false)
  assert.equal(rowClickOpensEntry(parent, null, ICON_CONTAINER), false)
})

console.log(`\n${checks} tree-row click checks passed`)
