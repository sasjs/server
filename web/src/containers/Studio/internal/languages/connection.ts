/**
 * The connection to the SAS language server running in a Web Worker.
 *
 * The server is @sasjs/sas-language's browser build: a classic worker that
 * speaks LSP over postMessage, with no client contract beyond the protocol
 * itself. This module owns the worker, the LSP handshake and the document
 * sync, and exposes the connection for the feature providers.
 *
 * Everything here is transport and protocol, so it carries no dependency on
 * monaco and is testable outside a browser by replacing the worker factory.
 */
import {
  BrowserMessageReader,
  BrowserMessageWriter,
  createProtocolConnection
} from 'vscode-languageserver-protocol/browser'

/**
 * The connection surface the providers and the service use. The runtime
 * object is the protocol connection; the type is stated here so the rest of
 * the app never imports the protocol package's browser subpath directly.
 */
export type MessageConnection = {
  sendRequest(method: string, params?: unknown): Promise<any>
  sendNotification(method: string, params?: unknown): Promise<void>
  onRequest(method: string, handler: (params: any) => unknown): void
  listen(): void
}

/** A text document identifier, as the protocol defines it. */
export type TextDocumentIdentifier = { uri: string }

/** Client capabilities sent at initialize, shaped for the SAS server. */
const clientCapabilities = {
  textDocument: {
    synchronization: { dynamicRegistration: false, didSave: true },
    hover: { contentFormat: ['markdown', 'plaintext'] },
    completion: {
      dynamicRegistration: false,
      contextSupport: true,
      completionItem: {
        snippetSupport: false,
        documentationFormat: ['markdown', 'plaintext'],
        labelDetailsSupport: true
      }
    },
    signatureHelp: {
      dynamicRegistration: false,
      signatureInformation: { documentationFormat: ['markdown', 'plaintext'] }
    },
    documentSymbol: {
      dynamicRegistration: false,
      hierarchicalDocumentSymbolSupport: true
    },
    semanticTokens: {
      dynamicRegistration: false,
      tokenTypes: [],
      tokenModifiers: [],
      formats: ['relative'],
      requests: { range: false, full: true }
    },
    formatting: { dynamicRegistration: false },
    rangeFormatting: { dynamicRegistration: false },
    onTypeFormatting: { dynamicRegistration: false },
    foldingRange: { dynamicRegistration: false }
  },
  workspace: {
    workspaceFolders: true,
    configuration: true,
    didChangeConfiguration: { dynamicRegistration: false }
  }
}

/**
 * The server's semantic tokens legend, as returned by initialize.
 */
export type SemanticTokensLegend = {
  tokenTypes: string[]
  tokenModifiers: string[]
}

export type SasConnection = {
  connection: MessageConnection
  legend: SemanticTokensLegend
}

/** A function that creates the language server worker. */
export type WorkerFactory = () => Worker

/**
 * The configuration requests the SAS server issues; the survey in the spike
 * harness showed these are the only client-bound requests it makes, and each
 * one is answered with vscode's documented default (null for anything
 * unset).
 */
const answerConfiguration = (params: {
  items?: { scopeUri?: string; section?: string }[]
}): unknown[] => (params.items ?? []).map(() => null)

/**
 * Starts the language server and completes the LSP handshake.
 *
 * A failure rejects, and the editor stays on its static providers: the
 * language support a live server adds is an enhancement, not a requirement
 * for the editor to work.
 */
export const connectSasLanguageServer = async (
  createWorker: WorkerFactory
): Promise<SasConnection> => {
  const worker = createWorker()
  const connection = createProtocolConnection(
    new BrowserMessageReader(worker),
    new BrowserMessageWriter(worker)
  )

  connection.onRequest('workspace/configuration', answerConfiguration)

  connection.listen()

  const result = await connection.sendRequest('initialize', {
    processId: null,
    rootUri: null,
    clientInfo: { name: 'sasjs-studio', version: '0.1.0' },
    capabilities: clientCapabilities,
    initializationOptions: {}
  })

  const legend = result.capabilities.semanticTokensProvider?.legend

  await connection.sendNotification('initialized', {})

  return {
    connection,
    legend: {
      tokenTypes: legend?.tokenTypes ?? [],
      tokenModifiers: legend?.tokenModifiers ?? []
    }
  }
}

/** Tells the server a document opened, with its full text. */
export const didOpen = (
  connection: MessageConnection,
  uri: string,
  text: string
): void => {
  connection.sendNotification('textDocument/didOpen', {
    textDocument: { uri, languageId: 'sas', version: 1, text }
  })
}

/**
 * Tells the server a document changed. The whole text is sent as a single
 * change: the server declares incremental sync, but a full-text change is
 * valid under it and keeps this module independent of monaco's diff
 * computation.
 *
 * The send is debounced by the caller's intent: monaco's content events
 * arrive per keystroke and there is no reason the server needs each one,
 * so the service batches them.
 */
export const didChange = (
  connection: MessageConnection,
  uri: string,
  text: string,
  version: number
): void => {
  connection.sendNotification('textDocument/didChange', {
    textDocument: { uri, version },
    contentChanges: [{ text }]
  })
}

/** Tells the server a document is no longer open. */
export const didClose = (connection: MessageConnection, uri: string): void => {
  connection.sendNotification('textDocument/didClose', {
    textDocument: { uri }
  })
}
