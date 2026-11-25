/**
 * A save that formats must not take the editor away.
 *
 * `editor.formatOnSave` is on by default, so every Ctrl+S on a SAS file rewrote
 * the buffer and then opened the comparison in place of the editor: the author
 * asked to write the file and lost the surface they were typing in. The rewrite
 * belongs in the buffer, said out loud in a notice that offers Review and Undo -
 * the comparison is a pane they can ask for, not something a save does to them.
 *
 * This drives the real `saveBuffer` from `useEditor`, with the formatter, the
 * drive and the snackbar substituted. Run with `npm run test:studiosaveformat`.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)
const { createSaveKeyHandler, bindSaveShortcut } =
  await import('../src/containers/Studio/internal/saveShortcut.ts')
const { createChangesKeyHandler, bindChangesShortcut } =
  await import('../src/containers/Studio/internal/changesShortcut.ts')

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

function fixture({ formats = true } = {}) {
  const slots = []
  let index = 0
  const listeners = new Map()
  const notices = []
  const undoRequests = []
  let notice = {}
  let written
  let releaseFormat
  let releaseWrite
  const released = { format: false, write: false }

  const wait = (kind) =>
    new Promise((resolve) => {
      if (kind === 'format') releaseFormat = resolve
      else releaseWrite = resolve
    })

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

  const text = 'data x;'
  const formatted = 'data x;\n'
  const editor = {
    focus() {},
    getDomNode: () => null,
    getModel: () => ({
      getValue: () => (written ?? text),
      getVersionId: () => 2
    }),
    hasTextFocus: () => false,
    addAction: () => ({ dispose() {} })
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
      setSnackbarMessage: (message, actions) => {
        notice.message = message
        notice.actions = actions
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
    rewriteBuffer: async () => 'unavailable',
    saveSnapshot: async ({ onFormatted, write }) => {
      if (formats) {
        onFormatted(text, formatted, { model: {}, version: 2 })
        if (!released.format) await wait('format')
      }
      await write(formatted)
      if (!released.write) await wait('write')
      return 'saved'
    },
    undoFormatting: (editorRef, snapshot) => {
      undoRequests.push(snapshot)
      return 'applied'
    },
    formatSasCode: async () => formatted,
    formatJson: () => ({ ok: true, text: formatted }),
    displayKindOf: () => null,
    lintAppliesTo: () => true,
    readSettings: () => ({ 'editor.formatOnSave': true }),
    createSaveKeyHandler,
    bindSaveShortcut,
    createChangesKeyHandler,
    bindChangesShortcut,
    document: {
      addEventListener: (type, fn) => listeners.set(type, fn),
      removeEventListener: (type) => listeners.delete(type)
    },
    isImageFile: () => false,
    axios: {
      post: async () => {},
      patch: async (_url, formData) => {
        written = await formData.get('file').text()
      }
    },
    FormData,
    Blob
  }
  const useEditor = vm.runInNewContext(`${code}; useEditor`, context)
  let state
  const render = () => {
    index = 0
    effects = []
    state = useEditor({
      selectedFilePath: '/test.sas',
      setSelectedFilePath() {},
      setTab() {}
    })
    return state
  }
  state = render()
  state.handleEditorDidMount(editor)
  state = render()

  return {
    render,
    notices,
    undoRequests,
    written: () => written,
    save: () => state.saveBuffer(),
    showChanges: () => state.showChanges(),
    setContent: (text) => state.setFileContent(text),
    release: () => {
      released.format = true
      released.write = true
      releaseFormat?.()
      releaseWrite?.()
    }
  }
}

// A formatted save says so in a notice with Review and Undo, and leaves the
// comparison closed.
{
  const f = fixture()
  const pending = f.save()
  assert.equal(f.render().saving, true, 'the save is visible while it runs')
  f.release()
  await pending
  assert.equal(
    f.render().review,
    null,
    'a save must not open the comparison over the editor'
  )
  assert.equal(f.render().saving, false, 'the save state clears')
  assert.equal(f.written(), 'data x;\n', 'the formatted text reaches the drive')
  const notice = f.notices.at(-1)
  assert.equal(notice.message, 'Saved and formatted.')
  assert.deepEqual(
    Array.from(notice.actions ?? [], (action) => action.label),
    ['Review', 'Undo'],
    'the notice offers the comparison and the undo'
  )
}

// Review opens the comparison in the pane; Undo takes the rewrite back.
{
  const f = fixture()
  const pending = f.save()
  f.release()
  await pending
  const [review, undo] = f.notices.at(-1).actions
  review.onClick()
  const opened = f.render().review
  assert.equal(opened.kind, 'format')
  assert.equal(opened.before, 'data x;')
  assert.equal(opened.after, 'data x;\n')
  undo.onClick()
  assert.equal(f.undoRequests.length, 1, 'Undo reaches the snapshot')
  assert.equal(f.undoRequests[0].before, 'data x;')
  assert.equal(f.render().review, null, 'Undo closes the comparison')
}

// A save with nothing to format is just a save, with no buttons attached.
{
  const f = fixture({ formats: false })
  const pending = f.save()
  f.release()
  await pending
  assert.equal(f.render().review, null)
  const notice = f.notices.at(-1)
  assert.equal(notice.message, 'File saved!')
  assert.equal(notice.actions, undefined, 'a plain save offers no actions')
}

// The Changes shortcut mirrors the button: it says so when the buffer matches
// the last load or save, opens the comparison once it does not, and closes it
// on a second press.
{
  const f = fixture({ formats: false })
  f.showChanges()
  assert.equal(f.render().review, null, 'nothing to compare yet')
  assert.equal(
    f.notices.at(-1).message,
    'No changes since the last load or save.'
  )
  f.setContent('edited')
  f.render()
  f.showChanges()
  assert.equal(f.render().review.kind, 'saved')
  assert.equal(f.render().review.before, '', 'compared against the baseline')
  f.showChanges()
  assert.equal(f.render().review, null, 'a second press puts it away')
}

// A save ends the comparison it was about: the buffer and the last save are
// the same text again, so the pane would only show the file against itself.
{
  const f = fixture({ formats: false })
  f.setContent('edited')
  f.render()
  f.showChanges()
  assert.equal(f.render().review?.kind, 'saved')
  const pending = f.save()
  f.release()
  await pending
  assert.equal(f.render().review, null, 'the save closes the comparison')
}

console.log(
  'Studio save: formatting stays in the buffer and is announced, not opened'
)
