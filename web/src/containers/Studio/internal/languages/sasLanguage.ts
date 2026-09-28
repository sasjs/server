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

export const SAS_LANGUAGE_ID = 'sas'

/**
 * Language configuration for SAS. Mirrors languages/sas.json in the SASjs VS
 * Code extension so that both editors comment, indent and close brackets alike.
 */
export const sasLanguageConfiguration: monaco.languages.LanguageConfiguration =
  {
    comments: {
      lineComment: '*',
      blockComment: ['/*', '*/']
    },
    brackets: [
      ['(', ')'],
      ['{', '}'],
      ['[', ']']
    ],
    autoClosingPairs: [
      { open: '(', close: ')' },
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: "'", close: "'", notIn: ['string', 'comment'] },
      { open: '"', close: '"', notIn: ['string', 'comment'] },
      { open: '/*', close: '*/', notIn: ['string'] }
    ],
    surroundingPairs: [
      { open: '(', close: ')' },
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: "'", close: "'" },
      { open: '"', close: '"' }
    ]
  }

// Each rule gets its own action object, so a factory rather than a shared constant.
const macroAction = () => ({
  cases: {
    '@macroKeywords': 'keyword.flow',
    '@macroFunctions': 'predefined',
    '@default': 'predefined'
  }
})

const statementAction = () => ({
  cases: {
    '@stepKeywords': 'keyword',
    '@keywords': 'keyword',
    '@controlKeywords': 'keyword.flow',
    '@operators': 'operator',
    '@functions': 'predefined',
    '@procNames': 'predefined',
    '@procStatements': 'keyword',
    '@dataOptions': 'keyword',
    '@styleKeywords': 'keyword',
    '@default': ''
  }
})

/**
 * Monarch tokenizer for the SAS language.
 *
 * Most statements are tokenized in the root state, where one word rule resolves
 * a token against the vocabulary lists. ODS, OPTIONS and PROC SQL carry a
 * vocabulary of their own, so they are tokenized in dedicated states that run to
 * the end of the statement.
 *
 * This module imports Monaco as a type only, so the grammar can be loaded and
 * tokenized outside a browser.
 */
export const sasMonarchLanguage: monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  ignoreCase: true,
  tokenPostfix: '.sas',

  brackets: [
    { token: 'delimiter.parenthesis', open: '(', close: ')' },
    { token: 'delimiter.square', open: '[', close: ']' },
    { token: 'delimiter.curly', open: '{', close: '}' }
  ],

  keywords: sasStatements,
  stepKeywords: sasStepKeywords,
  controlKeywords: sasControlKeywords,
  functions: sasFunctions,
  procNames: sasProcNames,
  procStatements: sasProcStatements,
  dataOptions: sasDataOptions,
  odsTypes: sasOdsTypes,
  odsKeywords: sasOdsKeywords,
  options: sasOptions,
  sqlKeywords: sasSqlKeywords,
  sqlOperators: sasSqlOperators,
  styleKeywords: sasStyleKeywords,
  macroKeywords: sasMacroKeywords,
  macroFunctions: sasMacroFunctions,
  operators: sasOperators,

  tokenizer: {
    root: [
      // A statement comment runs from a leading asterisk to the next semicolon.
      [/^[\s%]*\*/, 'comment', '@statementComment'],
      [/\/\*/, 'comment', '@blockComment'],

      // Statements that carry a vocabulary of their own.
      [/\bproc\s+sql\b/, 'keyword', '@sql'],
      [/\bods\b/, 'keyword', '@odsStatement'],
      [/\boptions\b/, 'keyword', '@optionsStatement'],

      // Macro variables, and macro invocations. A trailing dot disambiguates a
      // macro variable from the text that follows it.
      [/&&?[a-z_]\w*\.?/, 'variable'],
      [/%[a-z_]\w*/, macroAction()],

      // Formats, for example date9., $char10. or comma10.2. A format always
      // contains a dot, and that dot must not be followed by a word character,
      // which is what distinguishes a format from the library part of a data set
      // reference such as work.mydata.
      [/\$[a-z_0-9]\w*\.\d*(?![a-z_0-9])/i, 'type'],
      [/[a-z_]\w*\d*\.\d*(?![a-z_0-9])/i, 'type'],
      [/[a-z_]\w*\.(?=[a-z_])/i, 'identifier'],

      [/"/, 'string', '@doubleQuotedString'],
      [/'/, 'string', '@singleQuotedString'],

      [/\d+(\.\d+)?([ed][-+]?\d+)?/i, 'number'],

      [/[+\-*/<>=|~^]+/, 'operator'],
      [/[;,]/, 'delimiter'],
      [/[a-z_]\w*/, statementAction()],
      [/[()\[\]{}]/, '@brackets']
    ],

    statementComment: [
      [/;/, 'comment', '@pop'],
      [/[^;]+/, 'comment']
    ],

    blockComment: [
      [/\*\//, 'comment', '@pop'],
      [/[^*]+/, 'comment'],
      [/\*/, 'comment']
    ],

    doubleQuotedString: [
      [/[^"&\\]+/, 'string'],
      [/\\./, 'string.escape'],
      [/""/, 'string.escape'],
      // SAS resolves macro variables inside double quoted strings.
      [/&&?[a-z_]\w*\.?/, 'variable'],
      [/"/, 'string', '@pop'],
      [/./, 'string']
    ],

    singleQuotedString: [
      [/[^'\\]+/, 'string'],
      [/\\./, 'string.escape'],
      [/''/, 'string.escape'],
      [/'/, 'string', '@pop'],
      [/./, 'string']
    ],

    odsStatement: [
      [/;/, 'delimiter', '@pop'],
      [/\/\*/, 'comment', '@blockComment'],
      [/^[\s%]*\*/, 'comment', '@statementComment'],
      [/&&?[a-z_]\w*\.?/, 'variable'],
      [/%[a-z_]\w*/, macroAction()],
      [/"/, 'string', '@doubleQuotedString'],
      [/'/, 'string', '@singleQuotedString'],
      [
        /[a-z_]\w*/,
        {
          cases: {
            '@odsTypes': 'predefined',
            '@odsKeywords': 'keyword',
            '@default': ''
          }
        }
      ],
      [/\d+(\.\d+)?/, 'number'],
      [/[(),]/, 'delimiter'],
      [/[+\-*/<>=|~^]+/, 'operator']
    ],

    optionsStatement: [
      [/;/, 'delimiter', '@pop'],
      [/\/\*/, 'comment', '@blockComment'],
      [/^[\s%]*\*/, 'comment', '@statementComment'],
      [/&&?[a-z_]\w*\.?/, 'variable'],
      [/%[a-z_]\w*/, macroAction()],
      [/"/, 'string', '@doubleQuotedString'],
      [/'/, 'string', '@singleQuotedString'],
      [
        /[a-z_]\w*/,
        {
          cases: {
            '@options': 'keyword',
            '@default': ''
          }
        }
      ],
      [/\d+(\.\d+)?/, 'number'],
      [/[=(),]/, 'delimiter'],
      [/[+\-*/<>=|~^]+/, 'operator']
    ],

    // PROC SQL runs until QUIT, and shares little vocabulary with the rest of SAS.
    sql: [
      [/\/\*/, 'comment', '@blockComment'],
      [/^[\s%]*\*/, 'comment', '@statementComment'],
      [/\b(quit|run)\b/, 'keyword', '@pop'],
      [/&&?[a-z_]\w*\.?/, 'variable'],
      [/%[a-z_]\w*/, macroAction()],
      [/"/, 'string', '@doubleQuotedString'],
      [/'/, 'string', '@singleQuotedString'],
      [/[a-z_]\w*\.(?=[a-z_])/i, 'identifier'],
      [
        /[a-z_]\w*/,
        {
          cases: {
            '@sqlKeywords': 'keyword',
            '@sqlOperators': 'operator',
            '@functions': 'predefined',
            '@default': ''
          }
        }
      ],
      [/\d+(\.\d+)?/, 'number'],
      [/[;,()]/, 'delimiter'],
      [/[+\-*/<>=|~^]+/, 'operator']
    ]
  }
}
