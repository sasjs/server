import type * as monaco from 'monaco-editor'

import { sasGrammarLists } from './vocabulary'

export const SAS_LANGUAGE_ID = 'sas'

export const sasLanguageConfiguration: monaco.languages.LanguageConfiguration =
  {
    comments: {
      lineComment: '*',
      blockComment: ['/*', '*/']
    },
    brackets: [
      ['(', ')'],
      ['[', ']'],
      ['{', '}']
    ],
    autoClosingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '{', close: '}' },
      { open: "'", close: "'", notIn: ['string', 'comment'] },
      { open: '"', close: '"', notIn: ['string', 'comment'] },
      { open: '/*', close: '*/', notIn: ['string'] }
    ],
    surroundingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '{', close: '}' },
      { open: "'", close: "'" },
      { open: '"', close: '"' }
    ]
  }

export const sasMonarchLanguage: monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.sas',
  ignoreCase: true,

  brackets: [
    { token: 'delimiter.parenthesis', open: '(', close: ')' },
    { token: 'delimiter.square', open: '[', close: ']' },
    { token: 'delimiter.curly', open: '{', close: '}' }
  ],

  statements: sasGrammarLists.statements,

  procNames: sasGrammarLists.procNames,

  functions: sasGrammarLists.functions,

  callRoutines: sasGrammarLists.callRoutines,

  macroStatements: sasGrammarLists.macroStatements,

  macroFunctions: sasGrammarLists.macroFunctions,

  options: sasGrammarLists.options,

  systemOptions: sasGrammarLists.systemOptions,

  odsTagsets: sasGrammarLists.odsTagsets,

  styleElements: sasGrammarLists.styleElements,

  styleAttributes: sasGrammarLists.styleAttributes,

  styleLocations: sasGrammarLists.styleLocations,

  sqlKeywords: sasGrammarLists.sqlKeywords,

  tokenizer: {
    root: [
      // A statement comment runs from a leading asterisk to the next semicolon.
      [/^[\s%]*\*/, 'comment', '@statementComment'],
      [/\/\*/, 'comment', '@blockComment'],

      // Steps whose vocabulary differs from the rest of the language.
      [/\bproc\s+(sql|fedsql)\b/, 'keyword', '@sql'],
      // The word after PROC is a procedure name. Matching it in the same
      // rule keeps the statement in one state: `next` accepts a single
      // state, so a rule cannot push "procedure name, then statement body".
      [
        /(\bproc\b)(\s+)([a-z_]\w*)/,
        ['keyword', 'white', 'variable.predefined'],
        '@body'
      ],
      [/\bproc\b/, 'keyword', '@body'],
      [/\bods\b/, 'keyword', '@ods'],
      [/\boptions\b/, 'keyword', '@options'],
      [/\b(datalines4|cards4)\b/, 'keyword', '@datalines4'],
      [/\b(datalines|cards)\b/, 'keyword', '@datalines'],

      // Macro statements and macro variables.
      [
        /%[a-z_]\w*/,
        {
          cases: {
            '@macroStatements': 'keyword.flow',
            '@macroFunctions': 'variable.predefined',
            '@default': 'variable.predefined'
          }
        }
      ],
      [/&&?[a-z_]\w*\.?/, 'variable'],

      // Formats carry a trailing dot and a width; the dot must not be
      // followed by a word character, which is what separates a format
      // from the library part of work.mydata.
      [/\$[a-z_0-9]\w*\.\d*(?![a-z_0-9])/i, 'type'],
      [/[a-z_]\w*\d*\.\d*(?![a-z_0-9])/i, 'type'],
      [/[a-z_]\w*\.(?=[a-z_])/i, 'identifier'],

      [/"/, 'string', '@doubleQuotedString'],
      [/'/, 'string', '@singleQuotedString'],

      [/\d+(\.\d+)?([ed][-+]?\d+)?/i, 'number'],

      // An assignment target is not a statement keyword.
      [/[a-z_]\w*(?=\s*=)/, '', '@body'],
      // Otherwise the first word of a statement is a statement keyword.
      // The next state lives inside each case value: compileAction keeps
      // `next` only for object actions, and for `cases` returns just the
      // test function, so a sibling `next` key is silently dropped.
      [
        /[a-z_]\w*/,
        {
          cases: {
            '@statements': { token: 'keyword', next: '@body' },
            '@functions': { token: 'variable.predefined', next: '@body' },
            '@default': { token: '', next: '@body' }
          }
        }
      ],

      [/[+\-*/<>=|~^]+/, 'operator'],
      [/[;,]/, 'delimiter'],
      [/[()\[\]{}]/, '@brackets']
    ],

    // The rest of a statement. Keywords here are the ones that can appear
    // inside one, plus named options where a word sits before an '='.
    body: [
      [/;/, 'delimiter', '@pop'],
      [/\/\*/, 'comment', '@blockComment'],
      [
        /%[a-z_]\w*/,
        {
          cases: {
            '@macroStatements': 'keyword.flow',
            '@macroFunctions': 'variable.predefined',
            '@default': 'variable.predefined'
          }
        }
      ],
      [/&&?[a-z_]\w*\.?/, 'variable'],
      [/\$[a-z_0-9]\w*\.\d*(?![a-z_0-9])/i, 'type'],
      [/[a-z_]\w*\d*\.\d*(?![a-z_0-9])/i, 'type'],
      [/[a-z_]\w*\.(?=[a-z_])/i, 'identifier'],
      [/"/, 'string', '@doubleQuotedString'],
      [/'/, 'string', '@singleQuotedString'],
      [/\d+(\.\d+)?([ed][-+]?\d+)?/i, 'number'],
      [
        /(\bcall\b)(\s+)([a-z_]\w*)/,
        ['keyword', 'white', 'variable.predefined']
      ],
      [
        /[a-z_]\w*(?=\s*=)/,
        { cases: { '@options': 'keyword', '@default': '' } }
      ],
      [
        /\b(then|else|do|end|to|by|and|or|not|in|output|return|delete|link|goto|stop|continue|leave|display|missing)\b/,
        'keyword.flow'
      ],
      [
        /[a-z_]\w*(?=\s*\()/,
        { cases: { '@functions': 'variable.predefined', '@default': '' } }
      ],
      // A bare word can be a standalone option such as NOPRINT. Options
      // that take a value are caught by the rule above.
      [/[a-z_]\w*/, { cases: { '@options': 'keyword', '@default': '' } }],
      [/[+\-*/<>=|~^]+/, 'operator'],
      [/[(),]/, 'delimiter'],
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
      // SAS resolves macro references inside double quoted strings.
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

    // ODS statements name tagsets, style elements and style attributes.
    ods: [
      [/;/, 'delimiter', '@pop'],
      [/\/\*/, 'comment', '@blockComment'],
      [
        /%[a-z_]\w*/,
        {
          cases: {
            '@macroStatements': 'keyword.flow',
            '@default': 'variable.predefined'
          }
        }
      ],
      [/&&?[a-z_]\w*\.?/, 'variable'],
      [/"/, 'string', '@doubleQuotedString'],
      [/'/, 'string', '@singleQuotedString'],
      [
        /[a-z_]\w*(?=\s*=)/,
        {
          cases: {
            '@styleAttributes': 'keyword',
            '@statements': 'keyword',
            '@default': ''
          }
        }
      ],
      [
        /[a-z_]\w*/,
        {
          cases: {
            '@odsTagsets': 'variable.predefined',
            '@styleElements': 'variable.predefined',
            '@styleLocations': 'keyword',
            '@statements': 'keyword',
            '@default': ''
          }
        }
      ],
      [/\d+(\.\d+)?/, 'number'],
      [/[=(),]/, 'delimiter'],
      [/[+\-*/<>=|~^]+/, 'operator']
    ],

    // The OPTIONS statement is a list of system options.
    options: [
      [/;/, 'delimiter', '@pop'],
      [/\/\*/, 'comment', '@blockComment'],
      [
        /%[a-z_]\w*/,
        {
          cases: {
            '@macroStatements': 'keyword.flow',
            '@default': 'variable.predefined'
          }
        }
      ],
      [/&&?[a-z_]\w*\.?/, 'variable'],
      [/"/, 'string', '@doubleQuotedString'],
      [/'/, 'string', '@singleQuotedString'],
      [
        /[a-z_]\w*(?=\s*=)/,
        { cases: { '@systemOptions': 'keyword', '@default': '' } }
      ],
      [/[a-z_]\w*/, { cases: { '@systemOptions': 'keyword', '@default': '' } }],
      [/\d+(?:\.\d+)?/, 'number'],
      [/[=(),]/, 'delimiter'],
      [/[+\-*/<>=|~^]+/, 'operator']
    ],

    // PROC SQL keeps its own vocabulary until QUIT or RUN.
    sql: [
      [/\/\*/, 'comment', '@blockComment'],
      [/^[\s%]*\*/, 'comment', '@statementComment'],
      [/\b(quit|run)\b/, 'keyword', '@pop'],
      [
        /%[a-z_]\w*/,
        {
          cases: {
            '@macroStatements': 'keyword.flow',
            '@default': 'variable.predefined'
          }
        }
      ],
      [/&&?[a-z_]\w*\.?/, 'variable'],
      [/"/, 'string', '@doubleQuotedString'],
      [/'/, 'string', '@singleQuotedString'],
      [/[a-z_]\w*\.(?=[a-z_])/i, 'identifier'],
      [
        /[a-z_]\w*(?=\s*\()/,
        { cases: { '@functions': 'variable.predefined', '@default': '' } }
      ],
      [
        /[a-z_]\w*/,
        {
          cases: {
            '@sqlKeywords': 'keyword',
            '@statements': 'keyword',
            '@default': ''
          }
        }
      ],
      [/\d+(\.\d+)?/, 'number'],
      [/[;,()]/, 'delimiter'],
      [/[+\-*/<>=|~^]+/, 'operator']
    ],

    // Instream data is literal text until the terminating semicolon.
    datalines: [
      [/^[\s]*;.*$/, 'delimiter', '@pop'],
      [/.*$/, 'string']
    ],

    // DATALINES4 and CARDS4 terminate on four semicolons.
    datalines4: [
      [/^[\s]*;;;;.*$/, 'delimiter', '@pop'],
      [/.*$/, 'string']
    ]
  }
}
