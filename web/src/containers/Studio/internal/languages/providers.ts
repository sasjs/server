/**
 * Monaco providers backed by the SAS language server connection.
 *
 * Each provider translates between monaco's shape and the LSP request it
 * maps to. The Monaco API arrives as an argument rather than an import, so
 * this module carries no runtime dependency on the editor and is testable
 * outside a browser, matching the pattern of ./completions and ./hover.
 */
import type * as monaco from 'monaco-editor'

import type { MessageConnection, SemanticTokensLegend } from './connection'
import { SAS_LANGUAGE_ID } from './sasLanguage'

/** Positions: monaco is 1-based, the protocol is 0-based. */
type ProtocolPosition = { line: number; character: number }

/**
 * Insert rule values, mirrored so that this module carries no runtime
 * dependency on the editor. The values match
 * monaco.languages.CompletionItemInsertTextRule.
 */
const INSERT_AS_SNIPPET = 4

const toLspPosition = (position: monaco.Position): ProtocolPosition => ({
  line: position.lineNumber - 1,
  character: position.column - 1
})

const fromLspRange = (range: {
  start: ProtocolPosition
  end: ProtocolPosition
}): monaco.IRange => ({
  startLineNumber: range.start.line + 1,
  startColumn: range.start.character + 1,
  endLineNumber: range.end.line + 1,
  endColumn: range.end.character + 1
})

/** A model's protocol uri, mapped from the monaco model uri. */
export const modelUri = (model: monaco.editor.ITextModel): string =>
  model.uri.toString()

/**
 * Completes a symbol or keyword at the cursor. The request is sent whatever
 * the trigger was; the server applies its own context rules.
 *
 * The range is computed by the caller, because monaco derives it from the
 * word at the position, which only the caller's model knows.
 */
export const provideCompletions = async (
  connection: MessageConnection,
  model: monaco.editor.ITextModel,
  position: monaco.Position,
  wordRange: monaco.IRange
): Promise<monaco.languages.CompletionList> => {
  const response = await connection.sendRequest('textDocument/completion', {
    textDocument: { uri: modelUri(model) },
    position: toLspPosition(position)
  })

  const items = (response?.items ?? response ?? []) as {
    label: string
    kind?: number
    insertText?: string
    insertTextFormat?: number
    textEdit?: { newText?: string }
    documentation?: { value?: string } | string
    detail?: string
    sortText?: string
  }[]

  return {
    incomplete: false,
    suggestions: items.map((item): monaco.languages.CompletionItem => ({
      label: item.label,
      kind: (item.kind ?? 1) as monaco.languages.CompletionItemKind,
      insertText: item.insertText ?? item.textEdit?.newText ?? item.label,
      insertTextRules:
        item.insertTextFormat === 2
          ? (INSERT_AS_SNIPPET as monaco.languages.CompletionItemInsertTextRule)
          : undefined,
      documentation: (item.documentation as { value?: string } | undefined)
        ?.value,
      detail: item.detail,
      sortText: item.sortText,
      range: wordRange
    }))
  }
}

/**
 * Shows the server's documentation for the word under the cursor. An absent
 * answer returns null, which monaco renders as no hover.
 */
export const provideHover = async (
  connection: MessageConnection,
  model: monaco.editor.ITextModel,
  position: monaco.Position
): Promise<monaco.languages.Hover | null> => {
  const response = await connection.sendRequest('textDocument/hover', {
    textDocument: { uri: modelUri(model) },
    position: toLspPosition(position)
  })

  if (!response) return null

  const contents = response.contents as
    { value?: string } | { value?: string }[]

  // The server sends its help as a markdown string inside a MarkupContent.
  const text = Array.isArray(contents)
    ? contents.map((c) => c.value ?? '').join('\n\n')
    : (contents.value ?? '')

  if (!text) return null

  return {
    range: response.range ? fromLspRange(response.range) : undefined,
    contents: [{ value: text }]
  }
}

/**
 * Provides the document's symbols, for the outline.
 */
export const provideDocumentSymbols = async (
  connection: MessageConnection,
  model: monaco.editor.ITextModel
): Promise<monaco.languages.DocumentSymbol[]> => {
  const response = await connection.sendRequest('textDocument/documentSymbol', {
    textDocument: { uri: modelUri(model) }
  })

  return (response ?? []).map((symbol: any) => ({
    name: symbol.name,
    detail: symbol.detail,
    kind: (symbol.kind ?? 1) as monaco.languages.SymbolKind,
    range: fromLspRange(symbol.range),
    selectionRange: fromLspRange(symbol.selectionRange)
  }))
}

/**
 * Provides the call signature at the cursor, inside a call's parentheses.
 */
export const provideSignatureHelp = async (
  connection: MessageConnection,
  model: monaco.editor.ITextModel,
  position: monaco.Position
): Promise<monaco.languages.SignatureHelpResult> => {
  const request = await connection.sendRequest('textDocument/signatureHelp', {
    textDocument: { uri: modelUri(model) },
    position: toLspPosition(position)
  })

  if (!request?.signatures?.length) {
    return {
      value: { signatures: [], activeSignature: 0, activeParameter: 0 },
      dispose: () => undefined
    }
  }

  const value: monaco.languages.SignatureHelp = {
    signatures: request.signatures.map((signature: any) => ({
      label: signature.label,
      documentation: (signature.documentation as { value?: string } | undefined)
        ?.value,
      parameters: (signature.parameters ?? []).map((parameter: any) => ({
        label: parameter.label,
        documentation: (
          parameter.documentation as { value?: string } | undefined
        )?.value
      }))
    })),
    activeSignature: request.activeSignature ?? 0,
    activeParameter: request.activeParameter ?? 0
  }

  return { value, dispose: () => undefined }
}

/**
 * Provides the document's folding ranges, so blocks collapse.
 */
export const provideFoldingRanges = async (
  connection: MessageConnection,
  model: monaco.editor.ITextModel
): Promise<monaco.languages.FoldingRange[]> => {
  const response = await connection.sendRequest('textDocument/foldingRange', {
    textDocument: { uri: modelUri(model) }
  })

  return (response ?? []).map(
    (range: { startLine: number; endLine: number; kind?: string }) => ({
      start: range.startLine + 1,
      end: range.endLine + 1,
      kind: (range.kind ?? undefined) as
        monaco.languages.FoldingRangeKind | undefined
    })
  )
}

/**
 * Provides whole-document formatting, for the editor's Format action.
 */
export const provideDocumentFormattingEdits = async (
  connection: MessageConnection,
  model: monaco.editor.ITextModel,
  options: monaco.languages.FormattingOptions
): Promise<monaco.languages.TextEdit[]> => {
  const response = await connection.sendRequest('textDocument/formatting', {
    textDocument: { uri: modelUri(model) },
    options: {
      tabSize: options.tabSize,
      insertSpaces: options.insertSpaces
    }
  })

  return (response ?? []).map((edit: any) => ({
    range: fromLspRange(edit.range),
    text: edit.newText
  }))
}

/**
 * Registers every server-backed provider with Monaco. Idempotent, so it is
 * safe to call before every editor mount. The Monaco API arrives as an
 * argument, matching the registration pattern of ./sas.
 */
export const registerSasLanguageServer = (
  monacoApi: typeof monaco,
  connection: MessageConnection,
  legend: SemanticTokensLegend
): void => {
  if (isRegistered) return
  isRegistered = true

  monacoApi.languages.registerCompletionItemProvider(SAS_LANGUAGE_ID, {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position)

      // The range covers the word already typed, so accepting a suggestion
      // replaces it rather than appending to it.
      const wordRange: monaco.IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      }

      return provideCompletions(connection, model, position, wordRange)
    },
    // The server applies its own context rules per trigger character.
    triggerCharacters: [' ', '.', '[', '"', "'"]
  })

  monacoApi.languages.registerHoverProvider(SAS_LANGUAGE_ID, {
    provideHover: (model, position) => provideHover(connection, model, position)
  })

  monacoApi.languages.registerDocumentSymbolProvider(SAS_LANGUAGE_ID, {
    provideDocumentSymbols: (model) => provideDocumentSymbols(connection, model)
  })

  monacoApi.languages.registerSignatureHelpProvider(SAS_LANGUAGE_ID, {
    provideSignatureHelp: (model, position) =>
      provideSignatureHelp(connection, model, position)
  })

  monacoApi.languages.registerFoldingRangeProvider(SAS_LANGUAGE_ID, {
    provideFoldingRanges: (model) => provideFoldingRanges(connection, model)
  })

  monacoApi.languages.registerDocumentFormattingEditProvider(SAS_LANGUAGE_ID, {
    provideDocumentFormattingEdits: (model, options) =>
      provideDocumentFormattingEdits(connection, model, options)
  })

  monacoApi.languages.registerDocumentSemanticTokensProvider(SAS_LANGUAGE_ID, {
    getLegend: () => legend,
    provideDocumentSemanticTokens: (model) =>
      provideDocumentSemanticTokens(connection, model),
    releaseDocumentSemanticTokens: () => undefined
  })
}

let isRegistered = false

/**
 * Asks the server for the document's semantic tokens and returns them in
 * the encoded form monaco consumes.
 */
const provideDocumentSemanticTokens = async (
  connection: MessageConnection,
  model: monaco.editor.ITextModel
): Promise<monaco.languages.SemanticTokens> => {
  const response = await connection.sendRequest(
    'textDocument/semanticTokens/full',
    { textDocument: { uri: modelUri(model) } }
  )

  const data = (response?.data ?? []) as number[]

  return { data: new Uint32Array(data) }
}
