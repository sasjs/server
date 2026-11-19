import assert from 'node:assert/strict'
import './test-change-review.mjs'
import './test-editor-review-wiring.mjs'
import { registerHooks } from 'node:module'
import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)
const changes =
  await import('../src/containers/Studio/internal/changes.ts').catch(
    (error) => {
      if (error.code === 'ERR_MODULE_NOT_FOUND') return {}
      throw error
    }
  )
assert.equal(
  typeof changes.rewriteBuffer,
  'function',
  'formatting must use a guarded, undoable rewrite'
)

const makeEditor = (initial) => {
  let text = initial
  let version = 1
  const model = {
    getValue: () => text,
    getVersionId: () => version,
    getFullModelRange: () => ({})
  }
  const stops = []
  const editor = {
    getModel: () => model,
    pushUndoStop: () => stops.push('stop'),
    executeEdits: (_source, edits) => {
      text = edits[0].text
      version++
      return true
    }
  }
  return {
    editor,
    model,
    stops,
    type: (value) => {
      text = value
      version++
    }
  }
}

// Eligibility is enforced by the real rewrite, before any formatter is invoked.
for (const [path, runtime, mode, expected] of [
  ['/code/example.py', 'sas', 'format', null],
  ['/code/readme.md', 'sas', 'fix', null],
  ['/code/example.json', 'sas', 'fix', null],
  ['/code/.sasjslint', 'sas', 'fix', null],
  ['', 'py', 'format', null],
  ['', 'py', 'fix', null],
  ['/code/example.SAS', 'py', 'format', 'sas'],
  ['/code/example.sas', 'py', 'fix', 'sas'],
  ['', 'sas', 'format', 'sas'],
  ['', 'sas', 'fix', 'sas'],
  ['/code/example.JSON', 'py', 'format', 'json'],
  ['/code/.sasjslint', 'sas', 'format', 'json']
]) {
  const { editor, model } = makeEditor('original')
  let called = false
  assert.equal(changes.formatKindFor({ path, runtime, mode }), expected)
  const result = await changes.rewriteBuffer({
    editor,
    isCurrent: () => true,
    formatContext: { path, runtime, mode },
    format: async () => {
      called = true
      return 'rewritten'
    },
    onApplied: () => {}
  })
  assert.equal(result, expected ? 'applied' : 'ineligible', `${path} ${mode}`)
  assert.equal(called, !!expected)
  assert.equal(model.getValue(), expected ? 'rewritten' : 'original')
}

{
  const { editor, model, stops } = makeEditor('before  ')
  let review
  const result = await changes.rewriteBuffer({
    editor,
    formatContext: { path: '/test.sas', runtime: 'sas', mode: 'format' },
    isCurrent: () => true,
    format: async () => 'after',
    onApplied: (before, after) => {
      review = [before, after]
    }
  })
  assert.equal(result, 'applied')
  assert.equal(model.getValue(), 'after')
  assert.deepEqual(review, ['before  ', 'after'])
  assert.deepEqual(stops, ['stop', 'stop'])
}
{
  const { editor, model, type } = makeEditor('sent')
  let resolve
  const pending = changes.rewriteBuffer({
    editor,
    formatContext: { path: '/test.sas', runtime: 'sas', mode: 'format' },
    isCurrent: () => true,
    format: () =>
      new Promise((r) => {
        resolve = r
      }),
    onApplied: () => assert.fail('stale review')
  })
  type('later edit')
  resolve('formatted')
  assert.equal(await pending, 'stale')
  assert.equal(model.getValue(), 'later edit')
}
{
  const { editor, model } = makeEditor('same text')
  let current = true
  let resolve
  const pending = changes.rewriteBuffer({
    editor,
    formatContext: { path: '/test.sas', runtime: 'sas', mode: 'format' },
    isCurrent: () => current,
    format: () =>
      new Promise((r) => {
        resolve = r
      }),
    onApplied: () => assert.fail('wrong file review')
  })
  current = false
  resolve('formatted')
  assert.equal(await pending, 'stale')
  assert.equal(model.getValue(), 'same text')
}
assert.equal(
  typeof changes.createReview,
  'function',
  'diff review must use isolated read-only models'
)
{
  const models = []
  let options
  let pair
  let disposed = false
  const api = {
    Uri: { from: (parts) => parts },
    editor: {
      createModel: (text) => {
        const model = {
          text,
          disposed: false,
          dispose() {
            this.disposed = true
          }
        }
        models.push(model)
        return model
      },
      createDiffEditor: (_node, opts) => {
        options = opts
        return {
          setModel: (value) => {
            pair = value
          },
          dispose: () => {
            disposed = true
          }
        }
      }
    }
  }
  const close = changes.createReview(api, {}, 'before  ', 'after', 'sas')
  assert.equal(options.readOnly, true)
  assert.equal(options.ignoreTrimWhitespace, false)
  assert.equal(options.renderSideBySide, false)
  assert.equal(options.renderMarginRevertIcon, false)
  assert.equal(pair.original.text, 'before  ')
  assert.equal(pair.modified.text, 'after')
  close()
  assert.equal(disposed, true)
  assert.ok(models.every((model) => model.disposed))
}
assert.equal(
  typeof changes.comparisonFor,
  'function',
  'Changes must compare the current buffer against the loaded/saved baseline'
)
assert.deepEqual(
  changes.comparisonFor({ kind: 'saved', before: 'loaded ' }, 'current'),
  { before: 'loaded ', after: 'current' }
)
assert.deepEqual(
  changes.comparisonFor(
    { kind: 'format', before: 'pre-format', after: 'formatted' },
    'later'
  ),
  { before: 'pre-format', after: 'formatted' }
)
assert.equal(
  typeof changes.saveSnapshot,
  'function',
  'saving must reject stale formatting before writing'
)
{
  const { editor, model, type } = makeEditor('sent')
  let resolve
  let writes = 0
  const pending = changes.saveSnapshot({
    editor,
    formatContext: { path: '/test.sas', runtime: 'sas', mode: 'format' },
    isCurrent: () => true,
    format: () =>
      new Promise((r) => {
        resolve = r
      }),
    write: async () => {
      writes++
    },
    onFormatted: () => assert.fail('stale review')
  })
  type('later edit')
  resolve('formatted')
  assert.equal(await pending, 'stale')
  assert.equal(writes, 0)
  assert.equal(model.getValue(), 'later edit')
}
{
  const { editor, model } = makeEditor('original')
  let written
  assert.equal(
    await changes.saveSnapshot({
      editor,
      formatContext: { path: '/test.sas', runtime: 'sas', mode: 'format' },
      isCurrent: () => true,
      format: async () => {
        throw new Error('offline')
      },
      write: async (text) => {
        written = text
      },
      onFormatted: () => assert.fail('no format review')
    }),
    'saved'
  )
  assert.equal(written, 'original')
  assert.equal(model.getValue(), 'original')
}
{
  const { editor, model, type } = makeEditor('sent')
  let written = false
  const pending = changes.saveSnapshot({
    editor,
    formatContext: { path: '/test.sas', runtime: 'sas', mode: 'format' },
    isCurrent: () => true,
    format: async () => 'formatted',
    write: async () => {
      written = true
    },
    onFormatted: () => queueMicrotask(() => type('later edit'))
  })
  assert.equal(await pending, 'stale')
  assert.equal(written, false)
  assert.equal(model.getValue(), 'later edit')
}
// Undo only the exact formatted snapshot, as a separate undoable edit.
{
  const { editor, model, stops } = makeEditor('before  ')
  let snapshot
  await changes.rewriteBuffer({
    editor,
    formatContext: { path: '/test.sas', runtime: 'sas', mode: 'format' },
    isCurrent: () => true,
    format: async () => 'after',
    onApplied: (before, after, applied) => {
      snapshot = { before, after, ...applied }
    }
  })
  assert.equal(
    typeof changes.undoFormatting,
    'function',
    'review can undo formatting'
  )
  assert.equal(
    changes.undoFormatting(editor, snapshot, () => true),
    'applied'
  )
  assert.equal(model.getValue(), 'before  ')
  assert.deepEqual(stops, ['stop', 'stop', 'stop', 'stop'])
}
// An intervening edit, even if its text returns to the formatted value, blocks undo.
{
  const { editor, model, type } = makeEditor('before')
  let snapshot
  await changes.rewriteBuffer({
    editor,
    formatContext: { path: '/test.sas', runtime: 'sas', mode: 'format' },
    isCurrent: () => true,
    format: async () => 'after',
    onApplied: (before, after, applied) => {
      snapshot = { before, after, ...applied }
    }
  })
  type('later edit')
  type('after')
  assert.equal(
    changes.undoFormatting(editor, snapshot, () => true),
    'stale'
  )
  assert.equal(model.getValue(), 'after')
  assert.equal(
    changes.undoFormatting(
      editor,
      { ...snapshot, version: model.getVersionId() },
      () => false
    ),
    'stale'
  )
  assert.equal(model.getValue(), 'after')
}
// Exercise the actual service and every registered provider against a model
// service and worker that record the LSP traffic reaching the server.
{
  const notifications = []
  const requests = []
  const handlers = {}
  const providers = {}
  const models = []
  const uri = (scheme, path) => ({
    scheme,
    path,
    toString: () => `${scheme}://${path}`
  })
  const createModel = (text, language, modelUri) => {
    const model = {
      uri: modelUri ?? uri('inmemory', `/model-${models.length}`),
      language,
      text,
      listeners: new Set(),
      getLanguageId() {
        return this.language
      },
      getValue() {
        return this.text
      },
      getVersionId() {
        return 1
      },
      getWordUntilPosition() {
        return { startColumn: 1, endColumn: 2 }
      },
      onDidChangeContent(callback) {
        this.listeners.add(callback)
        return { dispose: () => this.listeners.delete(callback) }
      },
      change() {
        for (const listener of this.listeners) listener()
      },
      dispose() {
        handlers.dispose?.(this)
        models.splice(models.indexOf(this), 1)
      }
    }
    models.push(model)
    handlers.create?.(model)
    return model
  }
  const api = {
    Uri: { from: ({ scheme, path }) => uri(scheme, path) },
    editor: {
      createModel,
      createDiffEditor: () => ({ setModel() {}, dispose() {} }),
      getModels: () => models,
      onDidCreateModel: (fn) => {
        handlers.create = fn
      },
      onWillDisposeModel: (fn) => {
        handlers.dispose = fn
      },
      onDidChangeModelLanguage: (fn) => {
        handlers.language = fn
      }
    },
    languages: new Proxy(
      {},
      {
        get: (_target, name) => (_language, provider) => {
          providers[name] = provider
        }
      }
    )
  }
  globalThis.__studioMonaco = api
  registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === 'monaco-editor')
        return {
          url: 'data:text/javascript,export const editor=globalThis.__studioMonaco.editor;export const languages=globalThis.__studioMonaco.languages;',
          shortCircuit: true
        }
      return nextResolve(specifier, context)
    }
  })
  globalThis.Worker = class {
    constructor() {
      this.listeners = new Set()
    }
    addEventListener(_type, listener) {
      this.listeners.add(listener)
    }
    removeEventListener(_type, listener) {
      this.listeners.delete(listener)
    }
    postMessage(message) {
      if (message.method === 'initialize') {
        queueMicrotask(() => {
          const event = {
            data: {
              jsonrpc: '2.0',
              id: message.id,
              result: { capabilities: {} }
            }
          }
          this.onmessage?.(event)
          for (const listener of this.listeners) listener(event)
        })
      } else if (message.method && 'id' in message) {
        requests.push(message)
        queueMicrotask(() => {
          const event = {
            data: {
              jsonrpc: '2.0',
              id: message.id,
              result: null
            }
          }
          this.onmessage?.(event)
          for (const listener of this.listeners) listener(event)
        })
      } else if (message.method) notifications.push(message)
    }
  }
  const snapshot = createModel(
    'data x;',
    'sas',
    uri('sasjs-review', '/before.sas')
  )
  const live = createModel('data live;', 'sas', uri('inmemory', '/live.sas'))
  const { startSasLanguageService } =
    await import('../src/containers/Studio/internal/languages/service.ts')
  await startSasLanguageService()
  assert.deepEqual(
    notifications
      .filter((n) => n.method === 'textDocument/didOpen')
      .map((n) => n.params.textDocument.uri),
    [live.uri.toString()],
    'only live SAS models are opened'
  )
  const position = { lineNumber: 1, column: 1 }
  const invocations = [
    ['registerCompletionItemProvider', 'provideCompletionItems', [position]],
    ['registerHoverProvider', 'provideHover', [position]],
    ['registerDocumentSymbolProvider', 'provideDocumentSymbols', []],
    ['registerSignatureHelpProvider', 'provideSignatureHelp', [position]],
    ['registerFoldingRangeProvider', 'provideFoldingRanges', []],
    [
      'registerDocumentFormattingEditProvider',
      'provideDocumentFormattingEdits',
      [{ tabSize: 2, insertSpaces: true }]
    ],
    [
      'registerDocumentSemanticTokensProvider',
      'provideDocumentSemanticTokens',
      []
    ]
  ]
  for (const [registered, method, args] of invocations) {
    await providers[registered][method](snapshot, ...args)
    assert.equal(requests.length, 0, `${method} must not request snapshot`)
    await providers[registered][method](live, ...args)
    assert.equal(requests.length, 1, `${method} must still request live model`)
    requests.length = 0
  }
  snapshot.language = 'plaintext'
  handlers.language({ model: snapshot })
  snapshot.language = 'sas'
  handlers.language({ model: snapshot })
  snapshot.change()
  live.change()
  await new Promise((resolve) => setTimeout(resolve, 350))
  snapshot.dispose()
  live.dispose()
  assert.deepEqual(
    notifications
      .filter((n) => n.method.startsWith('textDocument/'))
      .map((n) => [n.method, n.params.textDocument.uri]),
    [
      ['textDocument/didOpen', live.uri.toString()],
      ['textDocument/didChange', live.uri.toString()],
      ['textDocument/didClose', live.uri.toString()]
    ]
  )
  assert.equal(live.listeners.size, 0)
  const close1 = changes.createReview(api, {}, 'before', 'after', 'sas')
  const close2 = changes.createReview(api, {}, 'before', 'after', 'sas')
  assert.equal(models.length, 4)
  assert.ok(
    models.every(
      (model) => model.language === 'sas' && model.uri.scheme === 'sasjs-review'
    )
  )
  assert.equal(new Set(models.map((model) => model.uri.toString())).size, 4)
  close1()
  close2()
  assert.equal(models.length, 0)
  assert.equal(
    notifications.filter((n) => n.method.startsWith('textDocument/')).length,
    3
  )

  // Failure while constructing the widget must not strand its snapshot models.
  let diffDisposed = false
  api.editor.createDiffEditor = () => ({
    setModel() {
      throw new Error('widget setup failed')
    },
    dispose() {
      diffDisposed = true
    }
  })
  assert.throws(
    () => changes.createReview(api, {}, 'a', 'b', 'sas'),
    /widget setup failed/
  )
  assert.equal(diffDisposed, true)
  assert.equal(models.length, 0)

  // The second createModel can also fail after the first one was allocated.
  api.editor.createModel = (...args) => {
    if (models.length) throw new Error('model setup failed')
    return createModel(...args)
  }
  assert.throws(
    () => changes.createReview(api, {}, 'a', 'b', 'sas'),
    /model setup failed/
  )
  assert.equal(models.length, 0)
}
console.log(
  'Studio changes: guarded formatter and isolated whitespace-aware review'
)
