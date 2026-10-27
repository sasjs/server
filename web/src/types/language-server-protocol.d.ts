/**
 * Declarations for the one module the language service imports that the
 * compiler cannot resolve on its own.
 *
 * vscode-languageserver-protocol is exports-mapped, with no root types entry,
 * so node10 module resolution cannot see it. These declarations mirror the
 * subpaths the language service imports; the runtime modules resolve through
 * their package exports, which webpack 5 reads natively.
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
