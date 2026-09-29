import type * as monaco from 'monaco-editor'
import type { DocEntry, DocsFile } from '@sasjs/sas-language'
import { docsFor } from '@sasjs/sas-language'

import { SAS_LANGUAGE_ID } from './sasLanguage'
import { sasVocabularyGroups } from './vocabulary'

/**
 * The documentation for each group, loaded the first time a word from that
 * group is hovered.
 *
 * The package separates help text from the completion index for exactly this
 * reason: the index for every group is 76 KB and is always needed, while the
 * help runs to 1.2 MB and only the hovered word's own group is ever wanted.
 * Each loader therefore becomes its own chunk, and nothing is fetched until a
 * hover asks for it.
 */
const docLoaders: Record<string, () => Promise<unknown>> = {
  automaticVariables: () =>
    import('@sasjs/sas-language/data/automaticVariables.docs.json'),
  callRoutines: () => import('@sasjs/sas-language/data/callRoutines.docs.json'),
  ds2Functions: () => import('@sasjs/sas-language/data/ds2Functions.docs.json'),
  ds2Keywords: () => import('@sasjs/sas-language/data/ds2Keywords.docs.json'),
  formats: () => import('@sasjs/sas-language/data/formats.docs.json'),
  functions: () => import('@sasjs/sas-language/data/functions.docs.json'),
  hashMethods: () => import('@sasjs/sas-language/data/hashMethods.docs.json'),
  informats: () => import('@sasjs/sas-language/data/informats.docs.json'),
  macroDefinitionOptions: () =>
    import('@sasjs/sas-language/data/macroDefinitionOptions.docs.json'),
  macroFunctions: () =>
    import('@sasjs/sas-language/data/macroFunctions.docs.json'),
  macroStatements: () =>
    import('@sasjs/sas-language/data/macroStatements.docs.json'),
  odsTagsets: () => import('@sasjs/sas-language/data/odsTagsets.docs.json'),
  options: () => import('@sasjs/sas-language/data/options.docs.json'),
  procNames: () => import('@sasjs/sas-language/data/procNames.docs.json'),
  sqlKeywords: () => import('@sasjs/sas-language/data/sqlKeywords.docs.json'),
  statements: () => import('@sasjs/sas-language/data/statements.docs.json'),
  statisticsKeywords: () =>
    import('@sasjs/sas-language/data/statisticsKeywords.docs.json'),
  styleAttributes: () =>
    import('@sasjs/sas-language/data/styleAttributes.docs.json'),
  styleElements: () =>
    import('@sasjs/sas-language/data/styleElements.docs.json'),
  styleLocations: () =>
    import('@sasjs/sas-language/data/styleLocations.docs.json'),
  systemOptions: () =>
    import('@sasjs/sas-language/data/systemOptions.docs.json')
}

const loadedDocs = new Map<string, DocsFile>()

/**
 * A JSON module arrives either as the parsed object or wrapped in a default
 * export, depending on the bundler, so accept either shape.
 */
const unwrapDocs = (module: unknown): DocsFile => {
  const candidate = module as { default?: DocsFile } & DocsFile

  return candidate.default ?? candidate
}

/** Loads a group's help text, once per session. */
export const loadGroupDocs = async (
  group: string
): Promise<DocsFile | undefined> => {
  const cached = loadedDocs.get(group)

  if (cached) return cached

  const loader = docLoaders[group]

  if (!loader) return undefined

  const docs = unwrapDocs(await loader())

  loadedDocs.set(group, docs)

  return docs
}

let wordGroups: Map<string, string> | undefined

/**
 * Which group a word belongs to, so a hover loads only that group's help. Built
 * once and kept, because it is consulted on every hover.
 */
export const groupForWord = (word: string): string | undefined => {
  if (!wordGroups) {
    wordGroups = new Map()

    for (const group of sasVocabularyGroups) {
      for (const [name] of group.entries) {
        const key = name.toUpperCase()

        if (!wordGroups.has(key)) wordGroups.set(key, group.group)
      }
    }
  }

  return wordGroups.get(word.toUpperCase())
}

/**
 * The help text arrives as plain text, with procedure syntax laid out over
 * several lines. Markdown would collapse those lines into a paragraph, so
 * anything that opens with its syntax is shown as a code block instead, and
 * prose keeps its line breaks.
 */
export const helpMarkdown = (help: string): string =>
  help.startsWith('Syntax:')
    ? '```sas\n' + help.trimEnd() + '\n```'
    : help.replace(/\n/g, '  \n')

/** The hover body for one word. */
export const hoverContents = (
  word: string,
  label: string,
  doc: DocEntry
): monaco.IMarkdownString[] => [
  { value: `**${word}** - ${label}` },
  { value: helpMarkdown(doc.help) }
]

let isRegistered = false

/**
 * Registers the SAS hover provider with Monaco. Idempotent, so it is safe to
 * call before every editor mount.
 *
 * The Monaco API arrives as an argument rather than as an import, which keeps
 * this module free of any runtime dependency on the editor.
 */
export const registerSasHover = (monacoApi: typeof monaco): void => {
  if (isRegistered) return
  isRegistered = true

  monacoApi.languages.registerHoverProvider(SAS_LANGUAGE_ID, {
    provideHover: async (model, position) => {
      const word = model.getWordAtPosition(position)

      if (!word) return null

      const group = groupForWord(word.word)

      if (!group) return null

      const docs = await loadGroupDocs(group)

      if (!docs) return null

      const doc = docsFor(docs, word.word)

      if (!doc) return null

      const label =
        sasVocabularyGroups.find((candidate) => candidate.group === group)
          ?.label ?? group

      return {
        range: new monacoApi.Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn
        ),
        contents: hoverContents(word.word, label, doc)
      }
    }
  })
}
