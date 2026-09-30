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

/**
 * LSP CompletionItemKind mapped to monaco's, which do not share a numbering:
 * the protocol starts at Text=1, monaco at Method=0, so a value passed
 * straight through lands on the wrong icon (an LSP Keyword=14 renders as a
 * monaco Constant). Unknown kinds fall back to Text, the neutral one.
 */
const completionKindByLspKind: Partial<
  Record<number, monaco.languages.CompletionItemKind>
> = {
  1: 18, // Text
  2: 1, // Method -> Function
  3: 1, // Function
  4: 2, // Constructor
  5: 3, // Field
  6: 4, // Variable
  7: 5, // Class
  8: 7, // Interface
  9: 8, // Module
  10: 9, // Property
  11: 12, // Unit
  12: 13, // Value
  13: 15, // Enum
  14: 17, // Keyword
  15: 27, // Snippet
  16: 19, // Color
  17: 20, // File
  18: 21, // Reference
  19: 23, // Folder
  20: 16, // EnumMember
  21: 14, // Constant
  22: 6, // Struct
  23: 10, // Event
  24: 11, // Operator
  25: 24 // TypeParameter
}

const toMonacoCompletionKind = (
  kind: number | undefined
): monaco.languages.CompletionItemKind =>
  completionKindByLspKind[kind ?? 1] ?? 18 // Text, the neutral kind

/**
 * LSP SymbolKind mapped to monaco's. The protocol numbers are monaco's plus
 * one (LSP File=1, monaco File=0), so a value passed straight through lands
 * one kind off. A kind the protocol adds later falls back to Variable.
 */
const symbolKindByLspKind: Record<number, monaco.languages.SymbolKind> = {
  1: 0, // File
  2: 1, // Module
  3: 2, // Namespace
  4: 3, // Package
  5: 4, // Class
  6: 5, // Method
  7: 6, // Property
  8: 7, // Field
  9: 8, // Constructor
  10: 9, // Enum
  11: 10, // Interface
  12: 11, // Function
  13: 12, // Variable
  14: 13, // Constant
  15: 14, // String
  16: 15, // Number
  17: 16, // Boolean
  18: 17, // Array
  19: 18, // Object
  20: 19, // Key
  21: 20, // Null
  22: 21, // EnumMember
  23: 22, // Struct
  24: 23, // Event
  25: 24, // Operator
  26: 25 // TypeParameter
}

const toMonacoSymbolKind = (
  kind: number | undefined
): monaco.languages.SymbolKind =>
  // An absent kind defaults to the protocol's Variable (13), the neutral
  // outline entry; the fallback catches kinds the protocol adds later.
  symbolKindByLspKind[kind ?? 13] ?? 12

/**
 * Reads documentation that the protocol allows as either a plain string or a
 * MarkupContent; only .value was read before, so string documentation
 * arrived as undefined.
 */
const documentationText = (
  documentation: { value?: string } | string | undefined
): string | undefined =>
  typeof documentation === 'string' ? documentation : documentation?.value

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
      kind: toMonacoCompletionKind(item.kind),
      insertText: item.insertText ?? item.textEdit?.newText ?? item.label,
      insertTextRules:
        item.insertTextFormat === 2
          ? (INSERT_AS_SNIPPET as monaco.languages.CompletionItemInsertTextRule)
          : undefined,
      documentation: documentationText(item.documentation),
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
    kind: toMonacoSymbolKind(symbol.kind),
    range: fromLspRange(symbol.range),
    // selectionRange is required on DocumentSymbol but absent on
    // SymbolInformation; a flat answer falls back to the full range.
    selectionRange: symbol.selectionRange
      ? fromLspRange(symbol.selectionRange)
      : fromLspRange(symbol.range)
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
      documentation: documentationText(signature.documentation),
      parameters: (signature.parameters ?? []).map((parameter: any) => ({
        label: parameter.label,
        documentation: documentationText(parameter.documentation)
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
