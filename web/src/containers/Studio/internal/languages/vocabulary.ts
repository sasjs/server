/**
 * The SAS vocabulary the Studio editor offers.
 *
 * Resolved from @sasjs/sas-language, which publishes the keyword and help data
 * of the SAS extension for Visual Studio Code and reloads it on a schedule, so
 * this file holds no words of its own.
 *
 * Each group carries its own label and completion kind, so the editor does not
 * restate them.
 */
import type { IndexFile } from '@sasjs/sas-language'

import automaticVariables from '@sasjs/sas-language/data/automaticVariables.index.json'
import callRoutines from '@sasjs/sas-language/data/callRoutines.index.json'
import ds2Functions from '@sasjs/sas-language/data/ds2Functions.index.json'
import ds2Keywords from '@sasjs/sas-language/data/ds2Keywords.index.json'
import formats from '@sasjs/sas-language/data/formats.index.json'
import functions from '@sasjs/sas-language/data/functions.index.json'
import hashMethods from '@sasjs/sas-language/data/hashMethods.index.json'
import informats from '@sasjs/sas-language/data/informats.index.json'
import macroDefinitionOptions from '@sasjs/sas-language/data/macroDefinitionOptions.index.json'
import macroFunctions from '@sasjs/sas-language/data/macroFunctions.index.json'
import macroStatements from '@sasjs/sas-language/data/macroStatements.index.json'
import odsTagsets from '@sasjs/sas-language/data/odsTagsets.index.json'
import options from '@sasjs/sas-language/data/options.index.json'
import procNames from '@sasjs/sas-language/data/procNames.index.json'
import sqlKeywords from '@sasjs/sas-language/data/sqlKeywords.index.json'
import statements from '@sasjs/sas-language/data/statements.index.json'
import statisticsKeywords from '@sasjs/sas-language/data/statisticsKeywords.index.json'
import styleAttributes from '@sasjs/sas-language/data/styleAttributes.index.json'
import styleElements from '@sasjs/sas-language/data/styleElements.index.json'
import styleLocations from '@sasjs/sas-language/data/styleLocations.index.json'
import systemOptions from '@sasjs/sas-language/data/systemOptions.index.json'

/**
 * Formats and informats are published with their width left as a placeholder,
 * as in `$ASCIIw.`, because the width belongs to the use site rather than the
 * name. Those entries are dropped from completions: offering `$ASCIIw.` invites
 * a word that does not compile, while the widthless names beside it are useful.
 */
const isWidthTemplate = (name: string): boolean => name.endsWith('w.')

/**
 * Every group offered as a completion, in precedence order.
 *
 * The order matters twice over: a word claimed by more than one group keeps the
 * entry from the first group that holds it, for completions and for hover alike.
 * Upstream overlaps are real - `%PUT` is listed as both a macro statement and a
 * macro function, and `SUM` as both a SAS and a DS2 function - so this order
 * restates the precedence the editor has always used: the function form wins,
 * and the core SAS groups come before the narrower vocabularies.
 *
 * The WHERE operators are absent on purpose: they are phrases such as
 * `IS MISSING` and `BETWEEN-AND`, which are not words a completion provider
 * should insert.
 */
export const sasVocabularyGroups: IndexFile[] = [
  functions,
  callRoutines,
  macroFunctions,
  statements,
  procNames,
  odsTagsets,
  styleElements,
  styleAttributes,
  styleLocations,
  options,
  systemOptions,
  sqlKeywords,
  statisticsKeywords,
  hashMethods,
  automaticVariables,
  macroDefinitionOptions,
  formats,
  informats,
  ds2Functions,
  ds2Keywords,
  macroStatements
  // JSON imports widen tuples to arrays, so the assertion goes through unknown.
] as unknown as IndexFile[]

/** A word offered as a completion, and whether it takes a value. */
export interface VocabularyWord {
  name: string
  takesValue: boolean
}

/** A group's words, ready to offer, with the width templates removed. */
export const groupWords = (group: IndexFile): VocabularyWord[] =>
  group.entries
    .map(([name, , takesValue]) => ({ name, takesValue: takesValue === 1 }))
    .filter(({ name }) => !isWidthTemplate(name))

/**
 * The same groups, shaped for the syntax highlighter.
 *
 * Monarch resolves a `@list` against the words as written, and the grammar has
 * always carried them upper case, so they are normalised here. Duplicates are
 * collapsed: upstream packs aliases into one entry (`%INCLUDE|%INC`), which the
 * build already splits, and two groups can hold the same word.
 *
 * The groups are looked up by name rather than imported again, so this adds no
 * data of its own. Array.from rather than a spread: the app targets ES5, where
 * spreading a Set needs downlevelIteration.
 */
const grammarGroups = new Map(
  sasVocabularyGroups.map((group) => [group.group, group])
)

const monarchList = (name: string): string[] => {
  const group = grammarGroups.get(name)

  if (!group) return []

  return Array.from(
    new Set(group.entries.map(([word]) => word.toUpperCase()))
  ).sort()
}

/**
 * The highlighter's word lists, taken from the same groups as the completions so
 * the editor has one vocabulary rather than two. Each name matches a Monarch
 * `@list` reference in sasLanguage.ts.
 */
export const sasGrammarLists = {
  statements: monarchList('statements'),
  procNames: monarchList('procNames'),
  functions: monarchList('functions'),
  callRoutines: monarchList('callRoutines'),
  macroStatements: monarchList('macroStatements'),
  macroFunctions: monarchList('macroFunctions'),
  options: monarchList('options'),
  systemOptions: monarchList('systemOptions'),
  odsTagsets: monarchList('odsTagsets'),
  styleElements: monarchList('styleElements'),
  styleAttributes: monarchList('styleAttributes'),
  styleLocations: monarchList('styleLocations'),
  sqlKeywords: monarchList('sqlKeywords')
}

/** The path of a group's documentation, loaded on demand rather than up front. */
export const groupDocsPath = (group: string): string =>
  `@sasjs/sas-language/data/${group}.docs.json`
