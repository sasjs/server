import type * as monaco from 'monaco-editor'

import {
  sasControlKeywords,
  sasDataOptions,
  sasFunctions,
  sasMacroFunctions,
  sasMacroKeywords,
  sasOdsKeywords,
  sasOdsTypes,
  sasOperators,
  sasOptions,
  sasProcNames,
  sasProcStatements,
  sasSqlKeywords,
  sasSqlOperators,
  sasStatements,
  sasStepKeywords,
  sasStyleKeywords
} from './sasKeywords'
import { SAS_LANGUAGE_ID } from './sasLanguage'

/**
 * Completion kinds and insert rules, mirrored so that this module carries no
 * runtime dependency on the editor and can be tested outside a browser. The
 * values match monaco.languages.CompletionItemKind and
 * monaco.languages.CompletionItemInsertTextRule.
 */
const FUNCTION = 1 as monaco.languages.CompletionItemKind
const KEYWORD = 17 as monaco.languages.CompletionItemKind
const INSERT_AS_SNIPPET = 4 as monaco.languages.CompletionItemInsertTextRule

type CompletionSpec = Omit<monaco.languages.CompletionItem, 'range'>

const keywordItems = (words: string[], detail: string): CompletionSpec[] =>
  words.map((label) => ({ label, kind: KEYWORD, insertText: label, detail }))

/**
 * Functions are offered as snippets, so accepting one leaves the cursor inside
 * the parentheses rather than after them.
 */
const functionItems = (words: string[], detail: string): CompletionSpec[] =>
  words.map((label) => ({
    label,
    kind: FUNCTION,
    insertText: `${label}($0)`,
    insertTextRules: INSERT_AS_SNIPPET,
    detail
  }))

/**
 * Every SAS word the editor knows, from the same vocabulary the syntax
 * highlighter uses. A word claimed by more than one list appears once, and the
 * function entry wins, so accepting `sum` inserts a call rather than the bare
 * word.
 */
export const sasCompletionItems = (): CompletionSpec[] => {
  const items: CompletionSpec[] = [
    ...functionItems(sasFunctions, 'SAS function'),
    ...functionItems(sasMacroFunctions, 'SAS macro function'),
    ...keywordItems(sasStatements, 'SAS statement'),
    ...keywordItems(sasStepKeywords, 'SAS statement'),
    ...keywordItems(sasControlKeywords, 'SAS control keyword'),
    ...keywordItems(sasProcNames, 'SAS procedure'),
    ...keywordItems(sasProcStatements, 'SAS procedure statement'),
    ...keywordItems(sasDataOptions, 'SAS data set option'),
    ...keywordItems(sasOdsTypes, 'ODS destination'),
    ...keywordItems(sasOdsKeywords, 'ODS option'),
    ...keywordItems(sasOptions, 'SAS system option'),
    ...keywordItems(sasSqlKeywords, 'PROC SQL keyword'),
    ...keywordItems(sasSqlOperators, 'PROC SQL operator'),
    ...keywordItems(sasStyleKeywords, 'SAS style attribute'),
    ...keywordItems(sasMacroKeywords, 'SAS macro statement'),
    ...keywordItems(sasOperators, 'SAS operator')
  ]

  const seen = new Set<string>()

  return items.filter((item) => {
    const key = String(item.label).toLowerCase()

    if (seen.has(key)) return false

    seen.add(key)

    return true
  })
}

let isRegistered = false

/**
 * Registers the SAS completion provider with Monaco. Idempotent, so it is safe
 * to call before every editor mount.
 *
 * The Monaco API arrives as an argument rather than as an import, which keeps
 * this module free of any runtime dependency on the editor. Callers in the app
 * use the bound version exported from ./sas.
 */
export const registerSasCompletions = (monacoApi: typeof monaco): void => {
  if (isRegistered) return
  isRegistered = true

  const items = sasCompletionItems()

  monacoApi.languages.registerCompletionItemProvider(SAS_LANGUAGE_ID, {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position)

      // The range covers the word already typed, so accepting a suggestion
      // replaces it rather than appending to it.
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      }

      return { suggestions: items.map((item) => ({ ...item, range })) }
    }
  })
}
