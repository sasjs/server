/**
 * The language service: one worker, one connection, every open SAS model
 * kept in sync with the server.
 *
 * Started once, when Studio first mounts an editor. From that point the
 * models come to the service: monaco's model service emits didCreate and
 * dispose for every file, and each SAS model is opened or closed on the
 * server as it appears. The server is therefore always consistent with what
 * the editor shows, whatever route a file arrives by.
 *
 * A failure to start leaves the editor on its static providers: the
 * language support a live server adds is an enhancement, not a requirement
 * for the editor to work.
 */
import * as monaco from 'monaco-editor'

import {
  connectSasLanguageServer,
  didChange,
  didClose,
  didOpen,
  type MessageConnection,
  type SasConnection
} from './connection'
import { registerSasLanguageServer } from './providers'
import { enableSemanticHighlighting } from './semanticHighlighting'
import { SAS_LANGUAGE_ID } from './sasLanguage'

/**
 * Where the browser server build lives, inside the package. The exports map
 * publishes the server by subpath, and new URL keeps the file out of the
 * bundle: the server is a worker payload, not a module the app imports.
 */
const SERVER_WORKER_URL = new URL(
  '@sasjs/sas-language/server/browser',
  import.meta.url
).href

/** Tracks whether the one start has happened, and how it went. */
let startPromise: Promise<void> | null = null

/**
 * Forwards a model's changes to the server. Registered per model, because
 * the change event belongs to the model, and disposed with it.
 */
const syncModel = (
  connection: MessageConnection,
  model: monaco.editor.ITextModel
): monaco.IDisposable =>
  model.onDidChangeContent(() => {
    didChange(
      connection,
      model.uri.toString(),
      model.getValue(),
      model.getVersionId()
    )
  })

/** Opens a model with the server, and keeps its changes flowing. */
const openModel = (
  connection: MessageConnection,
  syncs: Map<string, monaco.IDisposable>,
  model: monaco.editor.ITextModel
): void => {
  const uri = model.uri.toString()

  didOpen(connection, uri, model.getValue())

  // The sync starts after the open, so the server sees the change stream
  // from the version it was given.
  syncs.set(uri, syncModel(connection, model))
}

/** Closes a model with the server, and stops its change stream. */
const closeModel = (
  connection: MessageConnection,
  syncs: Map<string, monaco.IDisposable>,
  model: monaco.editor.ITextModel
): void => {
  const uri = model.uri.toString()

  didClose(connection, uri)

  syncs.get(uri)?.dispose()
  syncs.delete(uri)
}

const isSasModel = (model: monaco.editor.ITextModel): boolean =>
  model.getLanguageId() === SAS_LANGUAGE_ID

/**
 * Starts the SAS language server and registers its providers.
 *
 * Idempotent: every call after the first awaits the same start, so any
 * number of components can call it on mount.
 */
export const startSasLanguageService = (): Promise<void> => {
  if (startPromise) return startPromise

  startPromise = (async () => {
    enableSemanticHighlighting()

    const { connection, legend }: SasConnection =
      await connectSasLanguageServer(
        () => new Worker(SERVER_WORKER_URL, { type: 'classic' })
      )

    registerSasLanguageServer(monaco, connection, legend)

    // The models that exist before the service starts, then everything
    // monaco creates or disposes from here on.
    const syncs = new Map<string, monaco.IDisposable>()

    monaco.editor.getModels().forEach((model) => {
      if (isSasModel(model)) openModel(connection, syncs, model)
    })

    monaco.editor.onDidCreateModel((model) => {
      if (isSasModel(model)) openModel(connection, syncs, model)
    })

    monaco.editor.onWillDisposeModel((model) => {
      if (isSasModel(model)) closeModel(connection, syncs, model)
    })
  })()

  return startPromise
}
