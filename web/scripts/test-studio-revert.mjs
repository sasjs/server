import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = readFileSync(
  new URL(
    '../src/containers/Studio/internal/hooks/useEditor.ts',
    import.meta.url
  ),
  'utf8'
)
const ast = ts.createSourceFile(
  'useEditor.ts',
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS
)
const declarations = ast.statements.filter(
  (node) =>
    ts.isFunctionDeclaration(node) &&
    ['captureRevert', 'applyRevert'].includes(node.name?.text)
)
assert.equal(
  declarations.length,
  2,
  'saved comparison must capture and safely apply an undoable revert'
)
const js = ts.transpileModule(
  declarations
    .map((node) => node.getText(ast).replace(/^export\s+/, ''))
    .join('\n'),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.None
    }
  }
).outputText
const { captureRevert, applyRevert } = vm.runInNewContext(
  `${js}; ({ captureRevert, applyRevert })`
)

function fixture() {
  let value = 'unsaved edit',
    version = 1,
    model
  const stops = [],
    history = []
  model = {
    getValue: () => value,
    getVersionId: () => version,
    getFullModelRange: () => ({})
  }
  let currentModel = model
  const editor = {
    getModel: () => currentModel,
    pushUndoStop: () => stops.push('stop'),
    executeEdits: (_source, edits) => {
      history.push(value)
      value = edits[0].text
      version++
      return true
    }
  }
  const context = {
    editor,
    path: '/test.sas',
    generation: 1,
    baseline: 'saved',
    reviewBaseline: 'saved',
    busy: false,
    saveEpoch: 1
  }
  return {
    context,
    model,
    stops,
    history,
    type: (text) => {
      value = text
      version++
    },
    swapModel: () => {
      currentModel = { ...model }
    }
  }
}
{
  const f = fixture()
  const snap = captureRevert(f.context)
  assert.ok(snap, 'capture current comparison')
  assert.equal(applyRevert(snap, f.context), 'applied')
  assert.equal(f.model.getValue(), 'saved')
  assert.deepEqual(f.stops, ['stop', 'stop'])
  assert.deepEqual(f.history, ['unsaved edit'])
}
for (const [name, change] of [
  [
    'baseline',
    (f) => {
      f.context.baseline = 'new saved'
    }
  ],
  [
    'comparison',
    (f) => {
      f.context.reviewBaseline = 'different'
    }
  ],
  [
    'path',
    (f) => {
      f.context.path = '/other'
    }
  ],
  [
    'generation',
    (f) => {
      f.context.generation++
    }
  ],
  ['model', (f) => f.swapModel()],
  [
    'edit even if undone',
    (f) => {
      f.type('another')
      f.type('unsaved edit')
    }
  ],
  [
    'save in progress',
    (f) => {
      f.context.busy = true
    }
  ],
  [
    'save started and finished',
    (f) => {
      f.context.saveEpoch++
    }
  ]
]) {
  const f = fixture(),
    snap = captureRevert(f.context)
  change(f)
  const current = f.context.editor.getModel().getValue()
  assert.equal(applyRevert(snap, f.context), 'stale', name)
  assert.equal(
    f.context.editor.getModel().getValue(),
    current,
    `${name}: preserves buffer`
  )
  assert.equal(f.history.length, 0, `${name}: no edits`)
}
{
  const f = fixture()
  f.context.busy = true
  assert.equal(
    captureRevert(f.context),
    null,
    'cannot start while saving or formatting'
  )
  f.context.busy = false
  f.context.reviewBaseline = 'older'
  assert.equal(
    captureRevert(f.context),
    null,
    'cannot start from stale comparison'
  )
}
console.log(
  'Studio revert: confirmation snapshot, undo boundaries and race guards'
)
