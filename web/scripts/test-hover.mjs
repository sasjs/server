/**
 * Asserts that the SAS hover provider resolves a word to its documentation, and
 * that it is wired to Monaco correctly.
 *
 * The hover module imports Monaco as a type only, and the resolver hook loads
 * JSON as a module, so both the lazy documentation load and the registration run
 * under plain node. Run with `npm run test:hover`.
 */
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { groupForWord, helpMarkdown, loadGroupDocs, registerSasHover } =
  await import('../src/containers/Studio/internal/languages/hover.ts')

const failures = []
const check = (label, condition) => {
  if (!condition) failures.push(label)
}

// Which group a word belongs to decides which documentation chunk is fetched.
check('a function resolves to its group', groupForWord('sum') === 'functions')
check(
  'a procedure resolves to its group',
  groupForWord('means') === 'procNames'
)
check(
  'a statement resolves to its group',
  groupForWord('data') === 'statements'
)
check(
  'a macro function resolves to its group',
  groupForWord('%put') === 'macroFunctions'
)
check('lookup ignores case', groupForWord('SUM') === 'functions')
check(
  'an unknown word resolves to nothing',
  groupForWord('notasasword') === undefined
)

// Procedure help opens with its syntax and must keep its layout, while prose
// must not be turned into a code block.
check(
  'syntax help becomes a code block',
  helpMarkdown('Syntax: PROC MEANS;').startsWith('```sas')
)
check(
  'syntax help closes its code block',
  helpMarkdown('Syntax: PROC MEANS;').endsWith('```')
)
check('prose keeps its line breaks', helpMarkdown('one\ntwo') === 'one  \ntwo')
check('prose is not fenced', !helpMarkdown('Returns the sum.').includes('```'))

// The documentation is fetched lazily, one group at a time.
const docs = await loadGroupDocs('functions')
check('a group loads its documentation', Boolean(docs?.entries))
check('the documentation carries help text', Boolean(docs?.entries?.ABS?.help))
check(
  'a loaded group is reused rather than refetched',
  (await loadGroupDocs('functions')) === docs
)
check(
  'an unknown group loads nothing',
  (await loadGroupDocs('nope')) === undefined
)

const calls = []
const monaco = {
  Range: class {
    constructor(startLineNumber, startColumn, endLineNumber, endColumn) {
      Object.assign(this, {
        startLineNumber,
        startColumn,
        endLineNumber,
        endColumn
      })
    }
  },
  languages: {
    registerHoverProvider: (...args) => {
      calls.push(args)
      return { dispose() {} }
    }
  }
}

registerSasHover(monaco)
registerSasHover(monaco) // must not register a second provider

check('one provider is registered', calls.length === 1)
check('the provider is registered for sas', calls[0][0] === 'sas')
check(
  'the provider offers hovers',
  typeof calls[0][1].provideHover === 'function'
)

const hoverFor = (word) =>
  calls[0][1].provideHover(
    {
      getWordAtPosition: () => ({ word, startColumn: 1, endColumn: 4 })
    },
    { lineNumber: 3, column: 2 }
  )

const sum = await hoverFor('sum')
check('a known word produces a hover', Boolean(sum))
check('the hover names the word', /sum/i.test(sum?.contents?.[0]?.value ?? ''))
check(
  'the hover names the group',
  sum?.contents?.[0]?.value?.includes('SAS function')
)
check(
  'the hover carries the documentation',
  sum?.contents?.[1]?.value?.includes('Returns the sum')
)
check(
  'the hover is ranged over the word',
  sum?.range?.startLineNumber === 3 &&
    sum?.range?.startColumn === 1 &&
    sum?.range?.endColumn === 4
)

const means = await hoverFor('means')
check(
  'procedure syntax is shown as code',
  means?.contents?.[1]?.value?.startsWith('```sas')
)
check('an unknown word produces no hover', (await hoverFor('nope')) === null)

// A second group must load independently, rather than the first group's help
// being served for everything.
const data = await hoverFor('data')
check('a second group produces a hover', Boolean(data))
check(
  'the second group serves its own documentation',
  data?.contents?.[1]?.value !== sum?.contents?.[1]?.value
)

if (failures.length) {
  console.log(`${failures.length} failed:`)
  for (const failure of failures) console.log(`  FAIL  ${failure}`)
  process.exit(1)
}

console.log('SAS hover: all checks passed')
