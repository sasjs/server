/**
 * Asserts the language server bridge: the LSP handshake against a fake
 * worker, the document sync notifications, and the provider translations
 * between monaco's shapes and the protocol's.
 *
 * The bridge modules import monaco as a type only, so everything here runs
 * under plain node, the same pattern as the completions and hover tests.
 * Run with `npm run test:language-server`.
 */
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { connectSasLanguageServer, didChange, didClose, didOpen } = await import(
  '../src/containers/Studio/internal/languages/connection.ts'
)
const {
  provideCompletions,
  provideDocumentSymbols,
  provideFoldingRanges,
  provideHover,
  provideSignatureHelp,
  registerSasLanguageServer
} = await import('../src/containers/Studio/internal/languages/providers.ts')

const failures = []
const check = (label, condition) => {
  if (!condition) failures.push(label)
}

/**
 * A MessagePort-shaped worker stand-in: the protocol's BrowserMessageReader
 * and Writer drive a real port surface, so the fake offers addEventListener,
 * removeEventListener, postMessage and start/col­se semantics for the
 * server side of the wire. Every request gets a response, and the
 * initialize response carries the legend the providers read.
 */
const fakeWorker = () => {
  const listeners = new Map()

  const worker = {
    onmessage: null,
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type).add(listener)
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener)
    },
    postMessage(message) {
      queueMicrotask(() => {
        const deliver = (data) => {
          worker.onmessage?.({ data })
          for (const listener of listeners.get('message') ?? []) {
            listener({ data })
          }
        }

        if (message.method === 'initialize') {
          deliver({
            jsonrpc: '2.0',
            id: message.id,
            result: {
              capabilities: {
                semanticTokensProvider: {
                  legend: {
                    tokenTypes: ['keyword', 'proc-name', 'comment'],
                    tokenModifiers: []
                  }
                }
              }
            }
          })
        } else if (message.method === 'textDocument/completion') {
          deliver({
            jsonrpc: '2.0',
            id: message.id,
            result: {
              items: [
                { label: 'data', kind: 17 },
                {
                  label: 'sum',
                  kind: 1,
                  insertText: 'sum($0)',
                  insertTextFormat: 2
                }
              ]
            }
          })
        } else if (message.method === 'textDocument/hover') {
          deliver({
            jsonrpc: '2.0',
            id: message.id,
            result: { contents: { value: 'DATA statement help' } }
          })
        } else if (message.method === 'textDocument/documentSymbol') {
          deliver({
            jsonrpc: '2.0',
            id: message.id,
            result: [
              {
                name: 'work.example',
                kind: 1,
                range: {
                  start: { line: 0, character: 0 },
                  end: { line: 1, character: 2 }
                },
                selectionRange: {
                  start: { line: 0, character: 0 },
                  end: { line: 0, character: 4 }
                }
              }
            ]
          })
        } else if (message.method === 'textDocument/signatureHelp') {
          deliver({
            jsonrpc: '2.0',
            id: message.id,
            result: {
              signatures: [
                { label: 'sum(a, b)', parameters: [{ label: 'a' }] }
              ],
              activeSignature: 0,
              activeParameter: 1
            }
          })
        } else if (message.method === 'textDocument/foldingRange') {
          deliver({
            jsonrpc: '2.0',
            id: message.id,
            result: [{ startLine: 0, endLine: 3 }]
          })
        } else if (message.method === 'textDocument/semanticTokens/full') {
          deliver({
            jsonrpc: '2.0',
            id: message.id,
            result: { data: [0, 0, 4, 1, 0] }
          })
        } else if ('id' in message && message.method) {
          deliver({ jsonrpc: '2.0', id: message.id, result: null })
        }
      })
    }
  }

  return worker
}

// -- the handshake ------------------------------------------------------
const { connection, legend } = await connectSasLanguageServer(fakeWorker)

check('the legend arrives from initialize', legend.tokenTypes.length === 3)
check('the legend keeps the server order', legend.tokenTypes[1] === 'proc-name')

// The configuration request is answered with the vscode default: a server
// that asks for configuration receives one null per item.
const configurationAnswer = await new Promise((resolve) => {
  const listeners = new Map()
  const sent = []

  const worker = {
    onmessage: null,
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type).add(listener)
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener)
    },
    postMessage(message) {
      sent.push(message)

      // Responses the bridge posts back carry no method; only requests
      // elicit the server side of the wire.
      if (!('method' in message)) return

      queueMicrotask(() => {
        const deliver = (data) => {
          worker.onmessage?.({ data })
          for (const listener of listeners.get('message') ?? []) {
            listener({ data })
          }
        }

        if (message.method === 'initialize') {
          deliver({
            jsonrpc: '2.0',
            id: message.id,
            result: { capabilities: {} }
          })
        } else {
          // The server asks for configuration right after initialize.
          deliver({
            jsonrpc: '2.0',
            id: 99,
            method: 'workspace/configuration',
            params: { items: [{ section: 'python' }, { section: 'sas' }] }
          })
        }
      })
    }
  }

  connectSasLanguageServer(() => worker).then(() => {
    // The server's request is answered by the bridge, which posts the
    // response through the same worker.
    setTimeout(() => {
      const answer = sent.find(
        (m) => m.id === 99 && Array.isArray(m.result) && m.result.length === 2
      )
      resolve(answer ?? null)
    }, 50)
  })
})

check(
  'workspace/configuration answers with a null per item',
  Array.isArray(configurationAnswer?.result) &&
    configurationAnswer.result.every((value) => value === null)
)

// -- the document sync --------------------------------------------------
const notifications = []
const recordingWorker = fakeWorker()
const originalPost = recordingWorker.postMessage.bind(recordingWorker)
recordingWorker.postMessage = (message) => {
  // Notifications carry a method but no id; this is what the server sees.
  if ('method' in message && !('id' in message)) {
    notifications.push(message)
  }

  return originalPost(message)
}

const recording = await connectSasLanguageServer(() => recordingWorker)

didOpen(recording.connection, 'file:///workspace/a.sas', 'data x;')
didChange(recording.connection, 'file:///workspace/a.sas', 'data x; run;', 2)
didClose(recording.connection, 'file:///workspace/a.sas')

const methods = notifications.map((n) => n.method)
check('didOpen reaches the server', methods.includes('textDocument/didOpen'))
check(
  'didChange reaches the server',
  methods.includes('textDocument/didChange')
)
check('didClose reaches the server', methods.includes('textDocument/didClose'))

const change = notifications.find((n) => n.method === 'textDocument/didChange')
check(
  'didChange carries the full text and version',
  change.params.contentChanges[0].text === 'data x; run;' &&
    change.params.textDocument.version === 2
)

// -- the provider translations ------------------------------------------
const model = {
  uri: { toString: () => 'file:///workspace/a.sas' },
  getWordUntilPosition: () => ({ startColumn: 1, endColumn: 5 }),
  getValue: () => 'data x;'
}

const completions = await provideCompletions(
  connection,
  model,
  { lineNumber: 2, column: 5 },
  { startLineNumber: 2, endLineNumber: 2, startColumn: 1, endColumn: 5 }
)
check(
  'completions translate to suggestions',
  completions.suggestions.length === 2
)
check(
  'a snippet item keeps its snippet insert rule',
  completions.suggestions.find((s) => s.label === 'sum')?.insertTextRules === 4
)
check(
  'every suggestion carries the typed word range',
  completions.suggestions.every((s) => s.range.startColumn === 1)
)

const hover = await provideHover(connection, model, {
  lineNumber: 1,
  column: 2
})
check(
  'hover carries the server text',
  hover.contents[0].value === 'DATA statement help'
)

const symbols = await provideDocumentSymbols(connection, model)
check(
  'symbols translate to monaco ranges',
  symbols[0].range.startLineNumber === 1
)
check(
  'a 0-based protocol line becomes 1-based',
  symbols[0].range.endLineNumber === 2
)

const signature = await provideSignatureHelp(connection, model, {
  lineNumber: 1,
  column: 4
})
check(
  'signature help returns a disposable result',
  typeof signature.dispose === 'function'
)
check(
  'signature help keeps the active parameter',
  signature.value.activeParameter === 1
)

const folding = await provideFoldingRanges(connection, model)
check(
  'folding ranges become 1-based',
  folding[0].start === 1 && folding[0].end === 4
)

// -- the registration ---------------------------------------------------
const calls = []
const monaco = {
  languages: {
    registerCompletionItemProvider: (...args) => {
      calls.push(['completions', args[0], args[1]])
      return { dispose() {} }
    },
    registerHoverProvider: (...args) => {
      calls.push(['hover', args[0], args[1]])
      return { dispose() {} }
    },
    registerDocumentSymbolProvider: (...args) => {
      calls.push(['symbols', args[0], args[1]])
      return { dispose() {} }
    },
    registerSignatureHelpProvider: (...args) => {
      calls.push(['signature', args[0], args[1]])
      return { dispose() {} }
    },
    registerFoldingRangeProvider: (...args) => {
      calls.push(['folding', args[0], args[1]])
      return { dispose() {} }
    },
    registerDocumentFormattingEditProvider: (...args) => {
      calls.push(['formatting', args[0], args[1]])
      return { dispose() {} }
    },
    registerDocumentSemanticTokensProvider: (...args) => {
      calls.push(['semanticTokens', args[0], args[1]])
      return { dispose() {} }
    }
  }
}

registerSasLanguageServer(monaco, connection, legend)
registerSasLanguageServer(monaco, connection, legend) // must not double-register

const registeredKinds = calls.map((c) => c[0])
check(
  'every provider is registered once',
  registeredKinds.length === 7 && new Set(registeredKinds).size === 7
)
check(
  'the providers are registered for sas',
  calls.every((c) => c[1] === 'sas')
)
check(
  'the semantic tokens provider carries the legend',
  calls.find((c) => c[0] === 'semanticTokens')[2].getLegend().tokenTypes
    .length === 3
)

if (failures.length) {
  console.log(`${failures.length} failed:`)
  for (const failure of failures) console.log(`  FAIL  ${failure}`)
  process.exit(1)
}

console.log('SAS language server bridge: all checks passed')
