import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)
const { createSaveKeyHandler, bindSaveShortcut } =
  await import('../src/containers/Studio/internal/saveShortcut.ts')
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
  true
)
const hook = ast.statements.find(
  (node) =>
    ts.isVariableStatement(node) &&
    node.declarationList.declarations.some(
      (declaration) => declaration.name.getText(ast) === 'useEditor'
    )
)
assert.ok(hook, 'useEditor hook found')
const code = ts.transpileModule(hook.getText(ast), {
  compilerOptions: {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.None
  }
}).outputText

function fixture(path = '/test.sas', holdWrites = false) {
  const slots = []
  let index = 0
  let listeners = new Map()
  let actions = new Map()
  let notices = []
  let writes = 0
  let releaseFormat
  let releaseWrite
  const write = async () => {
    writes++
    if (holdWrites)
      await new Promise((resolve) => {
        releaseWrite = resolve
      })
  }
  const document = {
    addEventListener: (type, fn) => listeners.set(type, fn),
    removeEventListener: (type) => listeners.delete(type)
  }
  const useState = (initial) => {
    const slot = index++
    if (!(slot in slots)) slots[slot] = initial
    return [
      slots[slot],
      (value) => {
        slots[slot] = typeof value === 'function' ? value(slots[slot]) : value
      }
    ]
  }
  const useRef = (initial) => {
    const slot = index++
    if (!(slot in slots)) slots[slot] = { current: initial }
    return slots[slot]
  }
  const editor = {
    focus() {},
    getDomNode: () => null,
    getModel: () => ({ getValue: () => 'code', getVersionId: () => 1 }),
    hasTextFocus: () => false,
    addAction: (action) => {
      actions.set(action.id, action.run)
      return { dispose() {} }
    }
  }
  let effects = []
  const context = {
    useState,
    useRef,
    useStateWithCallback: useState,
    useCallback: (callback) => callback,
    useContext: () => ({ runTimes: {} }),
    useEffect: (effect) => {
      effects.push(effect)
    },
    AppContext: {},
    RunTimeType: { SAS: 'sas' },
    useModal: () => ({
      Dialog() {},
      setOpenModal() {},
      setModalTitle() {},
      setModalPayload() {}
    }),
    useSnackbar: () => ({
      Snackbar() {},
      setOpenSnackbar: (open) => {
        if (open) notices.push({ ...notice })
      },
      setSnackbarMessage: (message) => {
        notice.message = message
      },
      setSnackbarSeverity: (severity) => {
        notice.severity = severity
      }
    }),
    AlertSeverityType: {
      Warning: 'warning',
      Info: 'info',
      Error: 'error',
      Success: 'success'
    },
    monaco: {
      KeyMod: { CtrlCmd: 1, Alt: 2, Shift: 4 },
      KeyCode: { KeyS: 1, KeyF: 2, Enter: 3 }
    },
    formatKindFor: () => 'sas',
    rewriteBuffer: () =>
      new Promise((resolve) => {
        releaseFormat = resolve
      }),
    formatSasCode() {},
    formatJson() {},
    displayKindOf() {},
    createSaveKeyHandler,
    bindSaveShortcut,
    document,
    isImageFile: () => false,
    axios: { post: write, patch: write },
    FormData,
    Blob
  }
  let notice = {}
  const useEditor = vm.runInNewContext(`${code}; useEditor`, context)
  const render = () => {
    index = 0
    effects = []
    const state = useEditor({
      selectedFilePath: path,
      setSelectedFilePath() {},
      setTab() {}
    })
    return state
  }
  let state = render()
  state.handleEditorDidMount(editor)
  state = render()
  for (const effect of effects) {
    const text = effect.toString()
    if (
      text.includes('createSaveKeyHandler') ||
      text.includes('saveFileAction')
    )
      effect()
  }
  return {
    render,
    notices,
    actions,
    startFormat: () => state.formatDocument(),
    finishFormat: () => releaseFormat('unchanged'),
    save: () => state.saveBuffer(),
    submit: (name) => state.handleFilePathInput(name),
    directSaveAs: (name) => state.saveFile(name),
    finishWrite: () => releaseWrite(),
    openModal: () => state.setOpenFilePathInputModal(true),
    shortcut: () => {
      let prevented = false
      listeners.get('keydown')({
        key: 's',
        ctrlKey: true,
        preventDefault: () => {
          prevented = true
        }
      })
      return prevented
    },
    writes: () => writes
  }
}

// Simulate a deferred formatter, then use every Save entry point.
if (process.env.CASE !== 'modal') {
  const f = fixture()
  const format = f.startFormat()
  await f.save()
  assert.match(
    f.notices.at(-1)?.message ?? '',
    /save.*(format|progress)|(?:format|progress).*save/i,
    'toolbar save reports busy'
  )
  assert.equal(f.writes(), 0)
  assert.equal(f.shortcut(), true, 'document Ctrl+S prevents browser save')
  assert.match(
    f.notices.at(-1)?.message ?? '',
    /save.*(format|progress)|(?:format|progress).*save/i,
    'document shortcut reports busy'
  )
  const before = f.notices.length
  f.actions.get('save-file')()
  assert.equal(f.notices.length, before + 1, 'Monaco save reports busy')
  await f.directSaveAs('/direct.sas')
  assert.match(
    f.notices.at(-1)?.message ?? '',
    /save.*(format|progress)/i,
    'direct Save As reports busy'
  )
  f.finishFormat()
  await format
}

// Save As was already open when formatting started: submission must not lose the path.
{
  const f = fixture()
  f.openModal()
  assert.equal(f.render().openFilePathInputModal, true)
  const format = f.startFormat()
  f.submit('/new.sas')
  assert.equal(
    f.render().openFilePathInputModal,
    true,
    'busy submission keeps dialog open'
  )
  assert.match(
    f.notices.at(-1)?.message ?? '',
    /save.*(format|progress)|(?:format|progress).*save/i,
    'busy submission reports failure'
  )
  assert.equal(f.writes(), 0)
  f.finishFormat()
  await format
  f.submit('/new.sas')
  assert.equal(
    f.render().openFilePathInputModal,
    false,
    'submission closes once accepted'
  )
  assert.equal(f.writes(), 1, 'retry writes file')
}
// Untitled Ctrl+S cannot quietly lose the request while formatting.
{
  const f = fixture('')
  const format = f.startFormat()
  await f.save()
  assert.equal(f.render().openFilePathInputModal, false)
  assert.match(f.notices.at(-1)?.message ?? '', /save.*(format|progress)/i)
  f.finishFormat()
  await format
  await f.save()
  assert.equal(f.render().openFilePathInputModal, true)
}

// A second Save As or shortcut while a write is in flight is also rejected visibly.
{
  const f = fixture('/test.sas', true)
  const pending = f.directSaveAs('/first.sas')
  f.openModal()
  f.submit('/second.sas')
  assert.equal(f.render().openFilePathInputModal, true)
  assert.match(f.notices.at(-1)?.message ?? '', /save.*progress/i)
  await f.save()
  assert.match(f.notices.at(-1)?.message ?? '', /save.*progress/i)
  await f.directSaveAs('/third.sas')
  assert.match(f.notices.at(-1)?.message ?? '', /save.*progress/i)
  assert.equal(f.writes(), 1)
  f.finishWrite()
  await pending
}
console.log('Studio busy save: toolbar, shortcuts and Save As race')
