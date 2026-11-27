/**
 * Asserts that the SAS completion provider offers the vocabulary the editor
 * knows, and that it is wired to Monaco correctly.
 *
 * The completions module imports Monaco as a type only, so both the item list
 * and the registration run under plain node. Run with `npm run test:completions`.
 */
import { registerHooks } from 'node:module'
import { readFileSync } from 'node:fs'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { registerSasCompletions, sasCompletionItems } =
  await import('../src/containers/Studio/internal/languages/completions.ts')

const failures = []
const check = (label, condition) => {
  if (!condition) failures.push(label)
}

// Kinds as monaco.languages.CompletionItemKind defines them.
const FUNCTION = 1
const KEYWORD = 17
const INSERT_AS_SNIPPET = 4

const items = sasCompletionItems()
const byLabel = new Map(
  items.map((item) => [String(item.label).toLowerCase(), item])
)

check('the list is not empty', items.length > 1500)
check(
  'no label is blank or padded',
  items.every((item) => {
    const label = String(item.label)
    return label.length > 0 && label.trim() === label
  })
)
check('no label is duplicated', byLabel.size === items.length)

check(
  'a statement is offered as a keyword',
  byLabel.get('data')?.kind === KEYWORD
)
check('a control keyword is offered', byLabel.get('if')?.kind === KEYWORD)
check('a PROC name is offered', byLabel.get('means')?.kind === KEYWORD)
check('a macro statement keeps its %', byLabel.has('%macro'))
check('a macro statement is a keyword', byLabel.get('%macro')?.kind === KEYWORD)

const coreMacro = byLabel.get('mf_getuser')
check('SASjs core macro is offered', Boolean(coreMacro))
check(
  'SASjs core macro inserts a snippet call',
  typeof coreMacro?.insertText === 'string' &&
    coreMacro.insertText.startsWith('%mf_getuser(') &&
    coreMacro.insertTextRules === INSERT_AS_SNIPPET
)
check(
  'SASjs core macro has a description and suite detail',
  Boolean(coreMacro?.documentation) &&
    /SASjs core/i.test(coreMacro?.detail ?? '') &&
    /base/i.test(coreMacro?.detail ?? '')
)

// Every generated macro remains offered with an honest default-install status.
// This is not a runtime inventory: a Drive can be stale or customized.
const generatedCore = JSON.parse(
  readFileSync(
    new URL(
      '../src/containers/Studio/internal/languages/coreSnippets.json',
      import.meta.url
    ),
    'utf8'
  )
)
const generatedSuites = JSON.parse(
  readFileSync(new URL('../src/containers/Studio/internal/languages/coreSnippetSuites.json', import.meta.url), 'utf8')
)
const generatedEntries = Object.keys(generatedCore).map((name) => ({ name, folder: generatedSuites[name] }))
const bundledFolders = ['base', 'ddl', 'fcmp', 'lua', 'server']
const additionalFolders = {
  meta: 'not bundled in Server; SAS 9 metadata',
  metax: 'not bundled in Server; SAS 9 metadata and OS commands',
  viya: 'not bundled in Server; Viya',
  xplatform: 'not bundled in Server; target platform dependencies'
}
const platformDetails = { server: 'SASjs Server' }
for (const folder of [...bundledFolders, ...Object.keys(additionalFolders)]) {
  const entries = generatedEntries.filter((entry) => entry.folder === folder)
  check(`${folder}: generated suite is not empty`, entries.length > 0)
  for (const { name } of entries) {
    const note = additionalFolders[folder] ?? platformDetails[folder]
    const expected = `SASjs core - ${folder}${note ? ` (${note})` : ''}`
    const item = byLabel.get(name)
    check(
      `${folder}/${name}: offered with accurate suite detail`,
      item?.detail === expected
    )
    check(
      `${folder}/${name}: warns that runtime availability may vary`,
      /availability depends on your Drive and runtime/i.test(
        item?.documentation ?? ''
      )
    )
  }
}
check(
  'all generated core folders have an explicit install-status test',
  generatedEntries.every(({ folder }) =>
    [...bundledFolders, ...Object.keys(additionalFolders)].includes(folder)
  )
)

const sum = byLabel.get('sum')
check('a function is offered as a function', sum?.kind === FUNCTION)
check(
  'a shared function inserts its argument snippet',
  sum?.insertText === 'sum(${1})'
)
const atan2 = byLabel.get('atan2')
check(
  'shared function labels keep vocabulary uppercase',
  atan2?.label === 'ATAN2'
)
check('another shared function label is uppercase', sum?.label === 'SUM')
check(
  'argument placeholders survive unchanged',
  atan2?.insertText === 'atan2(${1:x}, ${2:y})'
)
check('snippet description is offered', Boolean(atan2?.documentation))
check(
  'a function without a detailed snippet keeps the generic call',
  byLabel.get('add_table_attr')?.insertText === 'ADD_TABLE_ATTR($0)'
)
check(
  'a function inserts as a snippet',
  sum?.insertTextRules === INSERT_AS_SNIPPET
)
check('a function is described', Boolean(sum?.detail))
check('a macro function is offered', byLabel.get('%put')?.kind === FUNCTION)

// A word in several lists appears once, and the function entry wins.
check(
  'a shared word appears once',
  items.filter((i) => String(i.label).toLowerCase() === 'sum').length === 1
)
check(
  'every item has an insert text',
  items.every((item) => typeof item.insertText === 'string')
)

const calls = []
const monaco = {
  languages: {
    registerCompletionItemProvider: (...args) => {
      calls.push(args)
      return { dispose() {} }
    }
  }
}

registerSasCompletions(monaco)
registerSasCompletions(monaco) // must not register a second provider

check('one provider is registered', calls.length === 1)
check('the provider is registered for sas', calls[0][0] === 'sas')
check(
  'the provider triggers on %',
  calls[0][1].triggerCharacters?.includes('%')
)
check(
  'the provider offers completions',
  typeof calls[0][1].provideCompletionItems === 'function'
)

// The range must cover the word already typed, so accepting replaces it.
const result = calls[0][1].provideCompletionItems(
  {
    getWordUntilPosition: () => ({ startColumn: 1, endColumn: 4 }),
    getLineContent: () => 'sum'
  },
  { lineNumber: 3, column: 4 }
)

check('every item is suggested', result.suggestions.length === items.length)
check(
  'each suggestion carries the typed word range',
  result.suggestions.every(
    (s) =>
      s.range.startLineNumber === 3 &&
      s.range.endLineNumber === 3 &&
      s.range.startColumn === 1 &&
      s.range.endColumn === 4
  )
)
check(
  'the suggestion keeps its kind',
  result.suggestions.find((s) => String(s.label).toLowerCase() === 'sum')
    ?.kind === FUNCTION
)

// Monaco filters from the start of the replacement range. Only core macros
// include a preceding percent, and their filter text must match that prefix.
for (const { line, start, end, hasPercent } of [
  { line: 'mf_', start: 1, end: 4, hasPercent: false },
  { line: '%mf_', start: 2, end: 5, hasPercent: true },
  { line: '%', start: 2, end: 2, hasPercent: true },
  { line: 'x %Mf_tail', start: 4, end: 7, hasPercent: true },
  { line: 'x mf_tail', start: 3, end: 6, hasPercent: false }
]) {
  const suggestions = calls[0][1].provideCompletionItems(
    {
      getWordUntilPosition: () => ({ startColumn: start, endColumn: end }),
      getLineContent: () => line
    },
    { lineNumber: 1, column: end }
  ).suggestions
  const macro = suggestions.find((s) => s.label === 'mf_getuser')
  check(
    `${line}: core range starts correctly`,
    macro?.range.startColumn === start - Number(hasPercent)
  )
  check(`${line}: core range preserves suffix`, macro?.range.endColumn === end)
  check(
    `${line}: core filter matches range`,
    macro?.filterText === `${hasPercent ? '%' : ''}mf_getuser`
  )
  const ordinary = suggestions.find((s) => s.label === 'SUM')
  check(
    `${line}: ordinary range remains unchanged`,
    ordinary?.range.startColumn === start && ordinary?.range.endColumn === end
  )
}

if (failures.length) {
  console.log(`${failures.length} failed:`)
  for (const failure of failures) console.log(`  FAIL  ${failure}`)
  process.exit(1)
}

console.log(`SAS completions: ${items.length} items, all checks passed`)
