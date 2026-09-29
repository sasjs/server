import type * as monaco from 'monaco-editor'

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

/**
 * Every SAS word the editor knows, from the vocabulary published by
 * @sasjs/sas-language. A word claimed by more than one group appears once, and
 * the function entry wins, so accepting `sum` inserts a call rather than the
 * bare word.
 *
 * Functions are offered as snippets, so accepting one leaves the cursor inside
 * the parentheses. Options that take a value insert the trailing equals, so
 * accepting `bufno` leaves the cursor where the value belongs.
 */
export const sasCompletionItems = (): CompletionSpec[] => {
  const items: CompletionSpec[] = []

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
