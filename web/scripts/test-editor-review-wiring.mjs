import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import React from 'react'
import ts from 'typescript'

// Execute the complete parent component with deterministic hooks. Browser-only
// dependencies and the useEditor lifecycle are substituted; JSX and its actual
// ChangeReview props are produced by editor.tsx, not reconstructed in the test.
const require = createRequire(import.meta.url)
const source = readFileSync(
  new URL('../src/containers/Studio/editor.tsx', import.meta.url),
  'utf8'
)
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020
  }
}).outputText
const ChangeReview = () => null
const Component = () => null
let editorState
let displayMode
let displayChanges
const reactHooks = {
  ...React,
  useEffect: () => {},
  useState: () => [displayMode, (value) => displayChanges.push(value)]
}
const modules = {
  react: reactHooks,
  'react-monaco-editor': {
    default: Component,
    monaco: {
      languages: {
        json: {
          jsonDefaults: { diagnosticsOptions: {}, setDiagnosticsOptions() {} }
        }
      }
    }
  },
  '@sasjs/lint/sasjslint-schema.json': { default: { $id: 'test' } },
  './internal/components/changeReview': { ChangeReview },
  './internal/changes': {
    comparisonFor: (review, current) => ({
      before: review.before,
      after: review.kind === 'saved' ? current : review.after
    }),
    formatKindFor: () => 'sas'
  },
  './internal/displayMode': {
    displayModesFor: () => [],
    displayModeLabel: () => '',
    displayModeStorageKey: () => '',
    storedDisplayMode: () => 'source'
  },
  './internal/editorTheme': {
    defineEditorThemes() {},
    editorThemeFor: () => ''
  },
  '../../utils/hooks': {
    usePrompt() {},
    useColorMode: () => ['light'],
    useSetting: () => [false, () => {}]
  },
  './internal/helper': { languageForFile: () => 'sas' },
  './internal/languages': {
    registerSasCompletions() {},
    registerSasHover() {},
    registerSasLanguage() {},
    startSasLanguageService: async () => {}
  },
  './internal/hooks/useEditor': { default: () => editorState },
  '../../context/appContext': { RunTimeType: { SAS: 'sas' } },
  '../../utils': { isImageFile: () => false }
}
const exports = {}
new Function('require', 'exports', compiled)((name) => {
  if (name in modules) return modules[name]
  if (name.startsWith('.'))
    return { default: Component, DisplayPane: Component }
  return require(name)
}, exports)

const walk = (element) =>
  React.isValidElement(element)
    ? [element, ...React.Children.toArray(element.props.children).flatMap(walk)]
    : []

function render(review, options = {}) {
  const calls = []
  displayMode = options.mode ?? 'source'
  displayChanges = []
  editorState = {
    fileContent: 'current',
    prevFileContent: 'saved',
    selectedFileExtension: options.extension ?? 'sas',
    selectedRunTime: 'sas',
    runTimes: ['sas'],
    lintMarkers: [],
    review,
    saving: false,
    showChanges() {},
    relayout() {},
    beginRevert: () => {
      calls.push('begin')
      return options.beginResult ?? true
    },
    cancelRevert: () => calls.push('cancel'),
    confirmRevert: () => {
      calls.push('confirm')
      return options.result ?? true
    },
    undoFormat: () => {
      calls.push('undo')
      return options.result ?? true
    },
    setReview: (value) => calls.push(['review', value]),
    Dialog: Component,
    Snackbar: Component
  }
  const tree = exports.default({
    selectedFilePath: options.path ?? '/test.sas',
    setSelectedFilePath() {},
    tab: 'code',
    setTab() {},
    sideBarCollapsed: false,
    onToggleSideBar() {}
  })
  const reviews = walk(tree).filter((node) => node.type === ChangeReview)
  assert.equal(
    reviews.length,
    review ? 1 : 0,
    'parent mounts one review only when active'
  )
  // The pane that holds the editor, identified by the display switch that
  // hides it in the rendered mode - the thing this change is about.
  const editorPane = walk(tree).find(
    (node) =>
      node?.props?.sx?.flex === 1 &&
      node.props.sx.height === '100%' &&
      node.props.sx.display !== undefined &&
      React.Children.toArray(node.props.children).some(
        (child) => React.isValidElement(child) && child.type === Component
      )
  )
  assert.ok(editorPane, 'the editor is mounted')
  return { props: reviews[0]?.props, calls, displayChanges, editorPane }
}

for (const extension of ['sas', 'json']) {
  const saved = render(
    { kind: 'saved', before: 'saved' },
    { extension, path: `/test.${extension}` }
  )
  assert.equal(saved.props.before, 'saved')
  assert.equal(saved.props.after, 'current')
  assert.equal(saved.props.label, 'Last loaded or saved → current buffer')
  assert.equal(
    saved.props.onUndoFormatting,
    undefined,
    'saved must not offer undo formatting'
  )
  assert.equal(typeof saved.props.onRevert?.begin, 'function')
  assert.equal(saved.props.onRevert.begin(), true)
  saved.props.onRevert.cancel()
  saved.props.onRevert.confirm()
  assert.deepEqual(saved.calls, ['begin', 'cancel', 'confirm'])
  assert.deepEqual(saved.displayChanges, [])

  const format = render(
    { kind: 'format', before: 'before', after: 'formatted' },
    { extension, path: `/test.${extension}` }
  )
  assert.equal(format.props.before, 'before')
  assert.equal(format.props.after, 'formatted')
  assert.equal(format.props.label, 'Before formatting → formatted result')
  assert.equal(format.props.onRevert, undefined, 'format must not offer revert')
  assert.equal(typeof format.props.onUndoFormatting, 'function')
  format.props.onUndoFormatting()
  assert.deepEqual(format.calls, ['undo'])
  assert.deepEqual(format.displayChanges, [])
}

// A successful action returns a rendered preview to source; rejected actions do not.
for (const result of [true, false]) {
  const saved = render(
    { kind: 'saved', before: 'saved' },
    { mode: 'rendered', result }
  )
  saved.props.onRevert.confirm()
  assert.deepEqual(saved.calls, ['confirm'])
  assert.deepEqual(saved.displayChanges, result ? ['source'] : [])
  const format = render(
    { kind: 'format', before: 'before', after: 'after' },
    { mode: 'rendered', result }
  )
  format.props.onUndoFormatting()
  assert.deepEqual(format.calls, ['undo'])
  assert.deepEqual(format.displayChanges, result ? ['source'] : [])
}
// A comparison is a pane beside the buffer, never a replacement for it: the
// author asked to see the changes, not to stop typing.
for (const mode of ['source', 'split']) {
  const open = render({ kind: 'saved', before: 'saved' }, { mode })
  assert.equal(
    open.editorPane.props.sx.display,
    'block',
    `the editor stays visible beside a comparison in ${mode} mode`
  )
}
// The rendered view is the file's full-width view, so there the editor stays
// hidden - with or without a comparison.
for (const review of [null, { kind: 'saved', before: 'saved' }]) {
  assert.equal(
    render(review, { mode: 'rendered' }).editorPane.props.sx.display,
    'none',
    'the rendered mode keeps the editor hidden'
  )
}
const rejected = render(
  { kind: 'saved', before: 'saved' },
  { beginResult: false }
)
assert.equal(rejected.props.onRevert.begin(), false)
assert.deepEqual(rejected.calls, ['begin'])
const untitled = render(
  { kind: 'saved', before: 'baseline' },
  { path: '', mode: 'rendered' }
)
assert.equal(untitled.props.untitled, true)
untitled.props.onClose()
assert.deepEqual(untitled.calls, [['review', null]])
// Closing the comparison in the rendered mode returns to the rendering the
// author chose; it used to force the source view, which took them somewhere
// they had not asked to go.
assert.deepEqual(untitled.displayChanges, [])
render(null)
console.log(
  'Editor: review kind selects only its corresponding action and callbacks'
)
