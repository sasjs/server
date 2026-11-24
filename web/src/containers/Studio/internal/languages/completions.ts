import type * as monaco from 'monaco-editor'

import functionSnippets from '@sasjs/sas-language/snippets/functions.json'

import { SAS_LANGUAGE_ID } from './sasLanguage'
import { groupWords, sasVocabularyGroups } from './vocabulary'

/**
 * Completion kinds and insert rules, mirrored so that this module carries no
 * runtime dependency on the editor and can be tested outside a browser. The
 * values match monaco.languages.CompletionItemKind and
 * monaco.languages.CompletionItemInsertTextRule.
 */
const FUNCTION = 1 as monaco.languages.CompletionItemKind
const INSERT_AS_SNIPPET = 4 as monaco.languages.CompletionItemInsertTextRule

type CompletionSpec = Omit<monaco.languages.CompletionItem, 'range'>

type FunctionSnippet = {
  prefix: string | string[]
  body: string | string[]
  description?: string
}

const snippets = functionSnippets as Record<string, FunctionSnippet>

/** Detailed function completions indexed by their case-insensitive prefix. */
export const detailedFunctionItems = new Map<string, CompletionSpec>()
for (const snippet of Object.values(snippets)) {
  const prefixes = Array.isArray(snippet.prefix)
    ? snippet.prefix
    : [snippet.prefix]
  const body = Array.isArray(snippet.body)
    ? snippet.body.join('\n')
    : snippet.body
  for (const prefix of prefixes) {
    detailedFunctionItems.set(prefix.toLowerCase(), {
      label: prefix.toUpperCase(),
      kind: FUNCTION,
      insertText: body,
      insertTextRules: INSERT_AS_SNIPPET,
      documentation: snippet.description,
      detail: 'SAS function'
    })
  }
}

/**
 * Completions from the shared function snippets and the SAS vocabulary in
 * @sasjs/sas-language. For a matching label the detailed snippet wins over
 * vocabulary entries, and providers.ts suppresses matching LSP function and
 * method suggestions. Remaining vocabulary overlaps follow group order.
 *
 * Detailed snippets include argument placeholders; other functions insert a
 * call with the cursor inside. Options that take a value insert a trailing
 * equals, leaving the cursor where the value belongs.
 */
export const sasCompletionItems = (): CompletionSpec[] => {
  const items: CompletionSpec[] = Array.from(detailedFunctionItems.values())

  for (const group of sasVocabularyGroups) {
    const isFunction = group.kind === FUNCTION

    for (const { name, takesValue } of groupWords(group)) {
      items.push(
        isFunction
          ? {
              label: name,
              kind: group.kind,
              insertText: `${name}($0)`,
              insertTextRules: INSERT_AS_SNIPPET,
              detail: group.label
            }
          : {
              label: name,
              kind: group.kind,
              insertText: takesValue ? `${name}=` : name,
              detail: group.label
            }
      )
    }
  }

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
