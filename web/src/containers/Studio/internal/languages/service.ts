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
 * Forwards a model's changes to the server, debounced: monaco emits a
 * content event per keystroke and the server needs the settled text, not
 * every intermediate one, so the last event in the window is sent and
 * earlier ones are dropped. The timer belongs to the model's sync and is
 * disposed with it.
 */
const syncModel = (
  connection: MessageConnection,
  model: monaco.editor.ITextModel
): monaco.IDisposable => {
  let timer: ReturnType<typeof setTimeout> | null = null

  const listener = model.onDidChangeContent(() => {
    if (timer) clearTimeout(timer)

    timer = setTimeout(() => {
      timer = null

      didChange(
        connection,
        model.uri.toString(),
        model.getValue(),
        model.getVersionId()
      )
    }, 300)
  })

  return {
    dispose() {
      if (timer) clearTimeout(timer)

      listener.dispose()
    }
  }
}

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

  const start = (async () => {
    enableSemanticHighlighting()

    const { connection, legend }: SasConnection =
      await connectSasLanguageServer(
        () => new Worker(SERVER_WORKER_URL, { type: 'classic' })
      )

    registerSasLanguageServer(monaco, connection, legend)

    // The models that exist before the service starts, then everything
    // monaco creates, retargets or disposes from here on. A model's
    // language is tracked rather than assumed: an editor mounted before its
    // file's extension is known starts as plaintext, and the language
    // switch to sas arrives as a setModelLanguage call, so the open and
    // the close both key off the current language of a tracked model.
    const syncs = new Map<string, monaco.IDisposable>()

    const sync = (model: monaco.editor.ITextModel): void => {
      const sas = isSasModel(model)
      const tracked = syncs.has(model.uri.toString())

      if (sas && !tracked) openModel(connection, syncs, model)
      if (!sas && tracked) closeModel(connection, syncs, model)
    }

    monaco.editor.getModels().forEach(sync)

    monaco.editor.onDidCreateModel(sync)

    monaco.editor.onWillDisposeModel((model) => {
      if (syncs.has(model.uri.toString())) {
        closeModel(connection, syncs, model)
      }
    })

    monaco.editor.onDidChangeModelLanguage((event) => sync(event.model))
  })()

  // A failed start leaves the editor on its static providers, and clears
  // the cached rejection so a later mount retries the start instead of
  // awaiting the same failure forever.
  startPromise = start.catch((error) => {
    startPromise = null

    throw error
  })

  return startPromise
}
