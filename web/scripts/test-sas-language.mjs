/**
 * Asserts that the SAS language is handed to Monaco correctly: right language
 * id, right extensions, the grammar and configuration attached, and a second
 * call a no-op.
 *
 * The registration module takes the Monaco API as an argument, so a recording
 * stand-in exercises the real code path without a browser. Run with
 * `npm run test:language`.
 */
import { registerHooks } from 'node:module'

import { compile } from 'monaco-editor/esm/vs/editor/standalone/common/monarch/monarchCompile.js'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { registerSasLanguage } = await import(
  '../src/containers/Studio/internal/languages/register.ts'
)
const { SAS_LANGUAGE_ID, sasMonarchLanguage } = await import(
  '../src/containers/Studio/internal/languages/sasLanguage.ts'
)

const calls = []
const monaco = {
  languages: {
    register: (...args) => calls.push(['register', ...args]),
    setLanguageConfiguration: (...args) =>
      calls.push(['setLanguageConfiguration', ...args]),
    setMonarchTokensProvider: (...args) =>
      calls.push(['setMonarchTokensProvider', ...args])
  }
}

const failures = []
const check = (label, condition) => {
  if (!condition) failures.push(label)
}

registerSasLanguage(monaco)
registerSasLanguage(monaco) // must not register a second time

const names = calls.map((call) => call[0])
const callFor = (name) => calls.find((call) => call[0] === name)

check(
  'monaco.languages.register is called exactly once',
  names.filter((n) => n === 'register').length === 1
)
check(
  'setLanguageConfiguration is called exactly once',
  names.filter((n) => n === 'setLanguageConfiguration').length === 1
)
check(
  'setMonarchTokensProvider is called exactly once',
  names.filter((n) => n === 'setMonarchTokensProvider').length === 1
)
check('a repeated call registers nothing further', calls.length === 3)

const registration = callFor('register')
check(
  `the language id is ${SAS_LANGUAGE_ID}`,
  registration && registration[1].id === SAS_LANGUAGE_ID
)
check(
  'the .sas extension is claimed',
  registration && registration[1].extensions.includes('.sas')
)
check(
  'the SAS alias is declared',
  registration && registration[1].aliases.includes('SAS')
)

const configuration = callFor('setLanguageConfiguration')
check(
  'the configuration is keyed by the language id',
  configuration && configuration[1] === SAS_LANGUAGE_ID
)
check(
  'the line comment is *',
  configuration && configuration[2].comments.lineComment === '*'
)
check(
  'the block comment is /* */',
  configuration &&
    JSON.stringify(configuration[2].comments.blockComment) === '["/*","*/"]'
)

const provider = callFor('setMonarchTokensProvider')
check(
  'the tokenizer is keyed by the language id',
  provider && provider[1] === SAS_LANGUAGE_ID
)
check(
  'the tokenizer receives the SAS grammar',
  provider && provider[2] === sasMonarchLanguage
)

// Monaco compiles the grammar at registration time, so this must not throw.
try {
  const lexer = compile(SAS_LANGUAGE_ID, sasMonarchLanguage)
  check(
    'the registered grammar compiles',
    Boolean(lexer && lexer.tokenizer.root)
  )
  check(
    'the grammar declares the SAS vocabulary',
    sasMonarchLanguage.functions.length > 400
  )
  check(
    'the grammar declares the SAS PROC names',
    sasMonarchLanguage.procNames.length > 250
  )
  check('the grammar matches case insensitively', lexer.ignoreCase === true)
} catch (error) {
  failures.push(`the registered grammar compiles (threw: ${error.message})`)
}

if (failures.length) {
  console.log(`${failures.length} failed:`)
  for (const failure of failures) console.log(`  FAIL  ${failure}`)
  process.exit(1)
}

console.log(`SAS registration: ${calls.length} Monaco calls, all checks passed`)
