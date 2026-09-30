/**
 * Declarations for the two monaco-editor internals the language service
 * reaches past the public API for.
 *
 * Semantic colouring in the standalone API has no public switch:
 * StandaloneTheme hard-codes semanticHighlighting to false, so the
 * editor.semanticHighlighting setting is written through the standalone
 * configuration service. Both modules are plain ESM inside monaco-editor,
 * so webpack resolves them; these declarations keep the compiler informed
 * without loosening any project-wide setting.
 *
 * A monaco upgrade that moves either module fails the import at build time
 * here rather than silently losing colouring.
 */
declare module 'monaco-editor/esm/vs/editor/standalone/browser/standaloneServices.js' {
  /** The service accessor the standalone editor boots with. */
  export const StandaloneServices: {
    get<T>(serviceId: unknown): T
  }
}

declare module 'monaco-editor/esm/vs/platform/configuration/common/configuration.js' {
  /** The configuration service's accessor decorator, an identity at
   * runtime: the decorator call returns the id it was created with. */
  export const IConfigurationService: unknown
}

/**
 * vscode-languageserver-protocol is exports-mapped, with no root types entry,
 * so node10 module resolution cannot see it. These declarations mirror the
 * two subpaths the language service imports; the runtime modules resolve
 * through their package exports, which webpack 5 reads natively.
 */
declare module 'vscode-languageserver-protocol/browser' {
  export class BrowserMessageReader {
    constructor(worker: Worker)
  }

  export class BrowserMessageWriter {
    constructor(worker: Worker)
  }

  export function createProtocolConnection(
    reader: BrowserMessageReader,
    writer: BrowserMessageWriter
  ): {
    sendRequest(method: string, params?: unknown): Promise<any>
    sendNotification(method: string, params?: unknown): Promise<void>
    onRequest(method: string, handler: (params: any) => unknown): void
    listen(): void
  }
}
