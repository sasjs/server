import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as mui from '@mui/material'
import ts from 'typescript'

// Node cannot load TSX directly. Transpile the complete component, not a
// fragment of its source. SSR cannot run effects or expose event handlers, so
// preserve the returned React elements and emulate its two stateful hooks to
// exercise handlers and rerender. Only Monaco and the portal-based Dialog are
// replaced; the controls themselves render through the real MUI components.
const require = createRequire(import.meta.url)
const source = readFileSync(
  new URL(
    '../src/containers/Studio/internal/components/changeReview.tsx',
    import.meta.url
  ),
  'utf8'
)
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020
  }
}).outputText
let confirming = false
const reactHooks = {
  ...React,
  useRef: () => ({ current: null }),
  useEffect: () => {},
  useState: () => [
    confirming,
    (value) => {
      confirming = value
    }
  ]
}
const Dialog = ({ open, children }) =>
  open ? React.createElement('section', { role: 'dialog' }, children) : null
const exports = {}
new Function('require', 'exports', compiled)((name) => {
  if (name === 'react') return reactHooks
  if (name === '@mui/material') return { ...mui, Dialog }
  if (name === 'react-monaco-editor') return { monaco: {} }
  if (name === '../changes') return { createReview: () => {} }
  return require(name)
}, exports)

const childrenOf = (element) =>
  React.isValidElement(element) &&
  !(element.type === Dialog && !element.props.open)
    ? React.Children.toArray(element.props.children)
    : []
const walk = (element) => [element, ...childrenOf(element).flatMap(walk)]
const label = (element) => childrenOf(element).join('')
function fixture(props = {}) {
  confirming = false
  let tree
  const render = () => {
    tree = exports.ChangeReview({
      before: 'before',
      after: 'after',
      language: 'sas',
      label: 'Review changes',
      untitled: false,
      onClose: () => {},
      ...props
    })
    return renderToStaticMarkup(tree)
  }
  const button = (text) => {
    const match = walk(tree).filter(
      (node) => node?.type === mui.Button && label(node) === text
    )
    assert.equal(match.length, 1, `expected one ${text} button`)
    return match[0]
  }
  const dialog = () => walk(tree).find((node) => node?.type === Dialog)
  return { render, button, dialog }
}

{
  const f = fixture()
  const markup = f.render()
  assert.match(markup, /Review changes/)
  assert.match(markup, /Back to editor/)
  assert.match(markup, /aria-label="Changes comparison"/)
  assert.doesNotMatch(
    markup,
    /Undo formatting|Revert to saved|Revert to baseline|role="dialog"/
  )
}
{
  const f = fixture({ onUndoFormatting: () => {} })
  const markup = f.render()
  assert.match(markup, /Undo formatting/)
  assert.doesNotMatch(markup, /Revert to saved|Revert to baseline/)
}
{
  const f = fixture({
    onRevert: { begin: () => true, cancel: () => {}, confirm: () => {} }
  })
  const markup = f.render()
  assert.match(markup, /Revert to saved/)
  assert.doesNotMatch(markup, /Undo formatting/)
}
{
  const calls = []
  const f = fixture({
    onClose: () => calls.push('close'),
    onUndoFormatting: () => calls.push('undo'),
    onRevert: {
      begin: () => {
        calls.push('begin')
        return true
      },
      cancel: () => calls.push('cancel'),
      confirm: () => calls.push('confirm')
    }
  })
  let markup = f.render()
  assert.match(markup, /Undo formatting/)
  assert.match(markup, /Revert to saved/)
  f.button('Undo formatting').props.onClick()
  f.button('Back to editor').props.onClick()
  f.button('Revert to saved').props.onClick()
  markup = f.render()
  assert.match(markup, /role="dialog"/)
  assert.match(markup, /Revert to saved\?/)
  assert.match(markup, /last loaded or saved version/)
  // The confirm button is inside the dialog; the same label also appears in the toolbar.
  const confirmButton = walk(f.dialog()).find(
    (node) => node?.type === mui.Button && label(node) === 'Revert to saved'
  )
  assert.ok(confirmButton, 'confirmation button exists')
  confirmButton.props.onClick()
  assert.doesNotMatch(f.render(), /role="dialog"/)
  assert.deepEqual(calls, ['undo', 'close', 'begin', 'confirm'])
  f.button('Revert to saved').props.onClick()
  f.render()
  f.button('Cancel').props.onClick()
  assert.doesNotMatch(f.render(), /role="dialog"/)
  f.button('Revert to saved').props.onClick()
  f.render()
  f.dialog().props.onClose()
  assert.doesNotMatch(f.render(), /role="dialog"/)
  assert.deepEqual(calls, [
    'undo',
    'close',
    'begin',
    'confirm',
    'begin',
    'cancel',
    'begin',
    'cancel'
  ])
}
{
  let confirms = 0
  const f = fixture({
    untitled: true,
    onRevert: {
      begin: () => true,
      cancel: () => {},
      confirm: () => {
        confirms++
      }
    }
  })
  f.render()
  f.button('Revert to baseline').props.onClick()
  const markup = f.render()
  assert.match(markup, /Revert to baseline\?/)
  assert.match(markup, /current buffer with the baseline/)
  const confirm = walk(f.dialog()).find(
    (node) => node?.type === mui.Button && label(node) === 'Revert to baseline'
  )
  assert.ok(confirm)
  confirm.props.onClick()
  assert.equal(confirms, 1)
  assert.doesNotMatch(f.render(), /role="dialog"/)
}
{
  let confirms = 0
  const f = fixture({
    untitled: true,
    onRevert: {
      begin: () => false,
      cancel: () => {},
      confirm: () => {
        confirms++
      }
    }
  })
  assert.match(f.render(), /Revert to baseline/)
  f.button('Revert to baseline').props.onClick()
  assert.doesNotMatch(f.render(), /role="dialog"/)
  assert.equal(confirms, 0, 'rejected begin cannot confirm')
}
console.log('ChangeReview: rendered actions and confirmation callbacks')
