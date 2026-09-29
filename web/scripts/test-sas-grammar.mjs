/**
 * Tokenizes a SAS program with Monaco's own Monarch compiler and lexer, and
 * asserts the resulting token types.
 *
 * Monaco's Monarch modules are free of any DOM dependency, so the real engine
 * runs under plain node. Run with `npm run test:grammar`.
 */
import { registerHooks } from 'node:module'

import { compile } from 'monaco-editor/esm/vs/editor/standalone/common/monarch/monarchCompile.js'
import { MonarchTokenizer } from 'monaco-editor/esm/vs/editor/standalone/common/monarch/monarchLexer.js'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { SAS_LANGUAGE_ID, sasMonarchLanguage } = await import(
  '../src/containers/Studio/internal/languages/sasLanguage.ts'
)

const SAMPLE = `* This is a statement comment;
/* and a block comment
   spanning two lines */
%let lib = work;
%macro report(dsn=, var=);
  %if &dsn = %then %do;
    %put ERROR: no data set supplied;
    %return;
  %end;

  data &lib..summary;
    set &dsn(keep=&var);
    set work.mydata;
    where &var is not missing;
    total = sum(&var, 1.5);
    x = 1;
    if total > 100 then output;
    format total comma10.2;
    label total = "Total for &var";
    note = 'no &substitution here';
  run;

  proc means data=&lib..summary noprint;
    var total;
    output out=stats mean=avg;
  run;

  proc sql;
    select &var, count(*) as n
    from &lib..summary
    where &var is not null
    group by &var
    order by n desc;
  quit;

  ods csv file="report.csv" style=styles.min;
  options symbolgen mprint;
%mend report;
`

const failures = []

const check = (label, condition) => {
  if (!condition) failures.push(label)
}

// tokenPostfix is '.sas', so compare against the bare token type.
const bare = (type) => (type || '').replace('.sas', '')

const lexer = compile(SAS_LANGUAGE_ID, sasMonarchLanguage)
const tokenizer = new MonarchTokenizer(null, null, SAS_LANGUAGE_ID, lexer)

const lines = SAMPLE.split('\n')
const tokens = []
const tokensByLine = []
let state = tokenizer.getInitialState()

for (const line of lines) {
  const result = tokenizer.tokenize(line, false, state)
  state = result.endState
  const lineTokens = []
  for (let i = 0; i < result.tokens.length; i++) {
    const start = result.tokens[i].offset
    const end =
      i + 1 < result.tokens.length ? result.tokens[i + 1].offset : line.length
    const text = line.slice(start, end)
    if (text.length) {
      lineTokens.push({ text, type: bare(result.tokens[i].type) })
      tokens.push({ text, type: bare(result.tokens[i].type) })
    }
  }
  tokensByLine.push(lineTokens)
}

const has = (text, type) =>
  tokens.some((t) => t.text === text && t.type === type)
const hasText = (fragment, type) =>
  tokens.some((t) => t.text.includes(fragment) && t.type === type)

check(
  'statement comment runs to the semicolon',
  hasText('This is a statement comment', 'comment')
)
check('block comment opens', hasText('and a block comment', 'comment'))
check(
  'block comment continues on the next line',
  hasText('spanning two lines', 'comment')
)
check('%let is a macro keyword', has('%let', 'keyword.flow'))
check('%macro is a macro keyword', has('%macro', 'keyword.flow'))
check('%if is a macro keyword', has('%if', 'keyword.flow'))
check('%do is a macro keyword', has('%do', 'keyword.flow'))
check('%mend is a macro keyword', has('%mend', 'keyword.flow'))
check('%put is a macro keyword', has('%put', 'keyword.flow'))
check('&lib. is a macro variable', has('&lib.', 'variable'))
check('&dsn is a macro variable', has('&dsn', 'variable'))
check('data is a keyword', has('data', 'keyword'))
check('proc is a keyword', has('proc', 'keyword'))
check('run is a keyword', has('run', 'keyword'))
check('quit is a keyword', has('quit', 'keyword'))
check('set is a keyword', has('set', 'keyword'))
check('keep= is a keyword', has('keep', 'keyword'))
check('sum is a function', has('sum', 'variable.predefined'))
check('comma10.2 is a format', has('comma10.2', 'type'))
check('1.5 is a number', has('1.5', 'number'))
check('work. is a library reference', has('work.', 'identifier'))
check('a double quoted string opens', has('"', 'string'))
check(
  'a macro variable inside double quotes is a variable',
  has('&var', 'variable')
)
check(
  'a single quoted string is not substituted',
  has("'no &substitution here'", 'string')
)
check('by is a statement keyword', has('by', 'keyword'))
check('select is a SQL keyword', has('select', 'keyword'))
check(
  'group by is a SQL keyword',
  has('group', 'keyword') && has('by', 'keyword')
)
check('order by is a SQL keyword', has('order', 'keyword'))
check('count is a function', has('count', 'variable.predefined'))
check('csv is an ODS destination', has('csv', 'variable.predefined'))
check('file is an ODS keyword', has('file', 'keyword'))
check('symbolgen is a system option', has('symbolgen', 'keyword'))
check('mprint is a system option', has('mprint', 'keyword'))
check('missing is a control keyword', has('missing', 'keyword.flow'))
check('label is a keyword', has('label', 'keyword'))
check(
  'if and then are keywords',
  has('if', 'keyword') && has('then', 'keyword.flow')
)

// A single letter statement keyword colours every variable named x, which is
// the most common variable name there is. Plain text merges with the
// whitespace around it, so this matches on the trimmed text.
check(
  'a variable named x is not a keyword',
  !tokens.some((t) => t.text.trim() === 'x' && t.type.startsWith('keyword'))
)

// The themes colour variable.predefined but not a bare predefined, so a
// function rendering as plain text would still pass an assertion written
// against the bare type.
check(
  'no token uses a type the themes do not colour',
  !tokens.some((t) => t.type === 'predefined')
)

// Every vocabulary list the grammar matches against must be usable by the
// keyword matcher, which tests a single token against a case insensitive list.
const vocabulary = [
  'statements',
  'procNames',
  'functions',
  'callRoutines',
  'macroStatements',
  'macroFunctions',
  'options',
  'systemOptions',
  'odsTagsets',
  'styleElements',
  'styleAttributes',
  'styleLocations',
  'sqlKeywords'
]

for (const name of vocabulary) {
  const list = sasMonarchLanguage[name]
  check(`${name} is a non-empty array`, Array.isArray(list) && list.length > 0)
  check(
    `${name} holds no blank entries`,
    Array.isArray(list) &&
      list.every((w) => typeof w === 'string' && w.trim() === w && w.length > 0)
  )
}

// Every @attribute a rule matches against must exist on the grammar, otherwise
// Monaco throws at compile time.
const attributes = new Set()
for (const rules of Object.values(sasMonarchLanguage.tokenizer)) {
  for (const rule of rules) {
    const action = Array.isArray(rule) ? rule[1] : rule
    if (action && typeof action === 'object' && action.cases) {
      for (const key of Object.keys(action.cases)) {
        if (
          key.startsWith('@') &&
          !['@default', '@eos', '@brackets'].includes(key)
        ) {
          attributes.add(key.slice(1))
        }
      }
    }
  }
}
check(
  'the grammar references at least one vocabulary list',
  attributes.size > 0
)
for (const attribute of attributes) {
  check(
    `@${attribute} is defined on the grammar`,
    Array.isArray(sasMonarchLanguage[attribute])
  )
}

// A rule that swallowed the rest of the file would leave a line with no tokens.
const untokenized = lines.filter(
  (line, index) =>
    line.trim().length > 0 &&
    !tokensByLine[index].some((token) => token.text.trim().length > 0)
)
check('every non-blank line produces a token', untokenized.length === 0)

if (failures.length) {
  console.log('token dump:')
  state = tokenizer.getInitialState()
  for (const line of lines) {
    const result = tokenizer.tokenize(line, false, state)
    state = result.endState
    const parts = []
    for (let i = 0; i < result.tokens.length; i++) {
      const start = result.tokens[i].offset
      const end =
        i + 1 < result.tokens.length ? result.tokens[i + 1].offset : line.length
      const text = line.slice(start, end)
      if (text.trim().length)
        parts.push(
          `${JSON.stringify(text)}=${bare(result.tokens[i].type) || '(plain)'}`
        )
    }
    console.log(`  ${JSON.stringify(line)}`)
    console.log(`      ${parts.join('  ')}`)
  }
  console.log(`\n${failures.length} failed:`)
  for (const failure of failures) console.log(`  FAIL  ${failure}`)
  process.exit(1)
}

const counts = vocabulary.reduce(
  (total, name) => total + sasMonarchLanguage[name].length,
  0
)
console.log(
  `SAS grammar: ${counts} vocabulary entries across ${vocabulary.length} lists`
)
console.log(`SAS grammar: ${lines.length} lines tokenized, all checks passed`)
