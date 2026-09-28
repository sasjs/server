/**
 * Asserts that the SAS completion provider offers the vocabulary the editor
 * knows, and that it is wired to Monaco correctly.
 *
 * The completions module imports Monaco as a type only, so both the item list
 * and the registration run under plain node. Run with `npm run test:completions`.
 */
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { registerSasCompletions, sasCompletionItems } = await import(
  '../src/containers/Studio/internal/languages/completions.ts'
)

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

const sum = byLabel.get('sum')
check('a function is offered as a function', sum?.kind === FUNCTION)
check('a function inserts a call', sum?.insertText === 'SUM($0)')
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
  'the provider offers completions',
  typeof calls[0][1].provideCompletionItems === 'function'
)

// The range must cover the word already typed, so accepting replaces it.
const result = calls[0][1].provideCompletionItems(
  { getWordUntilPosition: () => ({ startColumn: 1, endColumn: 4 }) },
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

if (failures.length) {
  console.log(`${failures.length} failed:`)
  for (const failure of failures) console.log(`  FAIL  ${failure}`)
  process.exit(1)
}

console.log(`SAS completions: ${items.length} items, all checks passed`)
