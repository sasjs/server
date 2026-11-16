/** An object which specifies the severity level of each rule. A `default` entry sets the level for every rule that has no entry of its own, including rules added in future versions. */
export interface LintSeverityLevels {
  [rule: string]: 'warn' | 'error'
}

/**
 * A `.sasjslint` document: the rules as they sit on the drive.
 *
 * This is the payload `GET /SASjsApi/code/lint-config` answers with, and the
 * document a client hands to `new LintConfig(...)`. It is spelled out rather
 * than typed as `object` because tsoa reads this interface to write the
 * response schema: `object` emits `additionalProperties: false` with no
 * properties, which leaves a generated client unable to read a single field.
 *
 * The settings named here are `@sasjs/lint`'s own, so the schema they come from
 * is the one to compare against: `sasjslint-schema.json`. The assertion that
 * keeps them in step is `MissingSetting` / `everySettingIsNamed` in
 * `api/src/routes/api/spec/lintConfig.spec.ts`, so a rule added upstream fails
 * the suite's typecheck until it is named here.
 *
 * The document is OPEN, though, and the index signature says so. A drive's
 * `.sasjslint` is the author's file: `getDriveLintConfigObject` answers with it
 * parsed and unvalidated, and settings outside this list - `indentation`, which
 * the formatter reads - are in the document and reach the client as written.
 * Without the index signature tsoa emits `additionalProperties: false`, and a
 * generated client that validates responses rejects a perfectly ordinary answer.
 */
export interface LintConfigSettings {
  /** The schema an editor validates the file against, when the file names one. */
  $schema?: string
  /** Reports lines that contain a string listed in bannedStrings, such as a word that looks like a log message. Matching is case insensitive. Shows a warning when one is present. */
  noBannedStrings?: boolean
  /** Enforces no encoded passwords such as {SAS001} or {SASENC} in lines of SAS code. Shows an error when they are present. */
  noEncodedPasswords?: boolean
  /** Enforces a Doxygen header at the start of each SAS file: a comment block that opens with `/**` and closes with a line holding nothing but `**&#47;`. Shows a warning when the header is absent, when it opens or closes with a single asterisk, when the close shares its line with the header content, and when the block is never closed. The fix widens a single-asterisk marker and moves a close onto a line of its own; an unclosed block is left for the author. */
  hasDoxygenHeader?: boolean
  /** This sets the default program header - applies when a SAS program does NOT begin with `/**`. */
  defaultHeader?: string
  /** Captures problematic characters such as zero-width whitespace and others that look valid but usually are not (such as the en dash) */
  noGremlins?: boolean
  /** Reports %if used in open code - that is, outside every %macro definition in the file. Open-code %if-%then-%else is a SAS 9.4M5 feature, so a program that uses one cannot run on an earlier maintenance; at M5 the %then / %else clause has to be a %do / %end block. Off by default, because the rule encodes a release floor - enable it where the floor is earlier than 9.4M5. There is no fix; move the block inside a %macro definition. */
  noMacroIfInOpenCode?: boolean
  /** Reports a macro call whose argument list does not parse as written: a call that never closes (an unclosed quote, parenthesis or comment), or a parameter after the first name= one that carries no name= - text spilled at a comma inside a value. Quoting the value with %str() repairs both. Off by default. */
  noMalformedMacroCalls?: boolean
  /** An array of strings for the noBannedStrings rule to report. Matching is case insensitive, and each entry is matched literally, so a trailing space means what it says. */
  bannedStrings?: string[]
  /** An array of hex codes that represents allowed gremlins. */
  allowedGremlins?: string[]
  /** Enforces the presence of macro names in %mend statements. Shows a warning for %mend statements with missing or mismatched macro names. */
  hasMacroNameInMend?: boolean
  /** Enforces the presence of parentheses in macro definitions. Shows a warning for each macro defined without a parameter list, or without a name. The fix adds the empty parameter list to a definition that takes no parameters. */
  hasMacroParentheses?: boolean
  /** Enforces a configurable multiple for the number of spaces for indentation. Shows a warning for lines that are not indented by a multiple of this number. */
  indentationMultiple?: number
  /** The case the formatter gives SAS keywords, once it is given a layout engine (see formatText). Applied by that engine's lexer: strings and comments are left alone, but a name it cannot tell from a keyword - a DATA step variable called label - is cased with it. Defaults to preserve. */
  keywordCase?: string
  /** Enforces no uppercase characters in file names. Shows a warning when they are present. */
  lowerCaseFileNames?: boolean
  /** Enforces no uppercase characters in macro names, in the <h4> SAS Macros </h4> header and in the %macro and %mend statements. Shows a warning when they are present, and fixes the name in both places when asked to. */
  lowerCaseMacroNames?: boolean
  /** Enforces a configurable maximum line length. Shows a warning for lines exceeding this length. */
  maxLineLength?: number
  /** Enforces a configurable maximum line length for header section. Shows a warning for lines exceeding this length. */
  maxHeaderLineLength?: number
  /** Enforces a configurable maximum line length for data section. Shows a warning for lines exceeding this length. */
  maxDataLineLength?: number
  /** Sets the shortest macro name the linter treats as a macro name, and the shortest a file may define. A short name cannot be told apart from a format specifier inside a string - %s( is one character, %ld( is two. Shows a warning for a definition shorter than this. Set to 1 to switch the rule off. */
  minMacroNameLength?: number
  /** Disallows a close marker inside the Doxygen header, which SAS reads as the end of the header - the rest of it is then compiled as SAS. Covers a nested block comment, a literal sequence in header text and a bare close marker. Shows a warning for such a header. */
  noNestedCommentsInHeader?: boolean
  /** Enforces the absence of nested macro definitions. Shows a warning for each nested macro definition. */
  noNestedMacros?: boolean
  /** Enforces the absence of SAS comment statements that begin with a single asterisk, such as `* some text;`. Shows a warning for each such comment. Defaults to off. */
  noSingleAsteriskComments?: boolean
  /** Enforces no spaces in file names. Shows a warning when they are present. */
  noSpacesInFileNames?: boolean
  /** Enforces no indentation using tabs. Shows a warning when a line contains a tab. */
  noTabs?: boolean
  /** Enforces no trailing spaces in lines of SAS code. Shows a warning when they are present. */
  noTrailingSpaces?: boolean
  /** Reports a warning for each macro a file invokes without declaring it in the `<h4> SAS Macros </h4>` section of the header - the only header list `sasjs compile` reads. Macros that ship with SAS are always considered declared, and so are the macros listed in `ignoredMacros` (`webout` by default). The formatter resolves the warning by adding the macro names to the header, sorted alphabetically. A file with no Doxygen header is not reported: it has no `<h4> SAS Macros </h4>` section, and the fix cannot write into one, so `hasDoxygenHeader` reports the missing header instead. The same skip covers a leading comment that is not a header - one that fits on one line, one opened with a single asterisk, or a `/**` block whose close is not a line of its own - because `hasDoxygenHeader` reports each of those shapes and its fixes put the header into the form this rule can write into. */
  noUndeclaredMacros?: boolean
  /** Reports a warning for each macro declared in the `<h4> SAS Macros </h4>` section of the header that the file itself never invokes. The formatter removes the unused entries. A macro can be referenced indirectly, so the warning is advisory. */
  noUnusedMacros?: boolean
  /** Reports the statements and functions that run an operating system command, which need XCMD: the `x` statement, `call system`, `%sysexec`, `system(...)` and `%sysfunc(system(...))`, `options xcmd`, a `pipe` fileref and `systask command`. `options noxcmd` is not reported. Comments, quoted values and `datalines` payloads are not searched. There is no fix. */
  noXcmd?: boolean
  /** Reports a warning for each libref a file assigns with a LIBNAME statement and never uses in that file. A mention of the libref anywhere else counts as a use, including the indirect forms SAS accepts, such as `pathname(TESTWORK)`, `library=path2` and `fmtsearch=(path1 path2)`. Off by default, because a file is not a complete job - the libref can be used by an autoexec, by `%include`d code, or by another file in the same flow. There is no fix; list the librefs to leave alone in `ignoredLibnames`. */
  noUnusedLibnames?: boolean
  /** Enforces the configured terminating character for each line, including the last one. Shows a warning when incorrect line endings are present, and a warning for a file whose final line has no terminator; the formatter appends the missing terminator. */
  lineEndings?: string
  /** Enforces Macro Definition syntax. Shows a warning when incorrect syntax is used. */
  strictMacroDefinition?: boolean
  /** An array of paths or path patterns to ignore when linting. Any files or matching patterns in the .gitignore file will also be ignored. */
  ignoreList?: string[]
  /** An array of librefs that `noUnusedLibnames` leaves alone. A single file can add to this list with the `ignoredLibnames` key of its `@sasjslint` header block. */
  ignoredLibnames?: string[]
  /** An array of macros that `noUndeclaredMacros` treats as declared: an entry is neither reported nor added to the header by the formatter. Use it for macros that no file in the project provides - the default entry, `webout`, is injected by `sasjs compile`. An explicit list replaces the default. A single file can add to this list with the `ignoredMacros` key of its `@sasjslint` header block. */
  ignoredMacros?: string[]
  /** Enforces required macro options as defined by requiredMacroOptions */
  hasRequiredMacroOptions?: boolean
  /** An array of macro options to require all macros to include. */
  requiredMacroOptions?: string[]
  /** An object which specifies the severity level of each rule. A `default` entry sets the level for every rule that has no entry of its own, including rules added in future versions. */
  severityLevel?: LintSeverityLevels
}

/**
 * The document the route answers with: every named setting, plus whatever else
 * the drive's file carries.
 *
 * The index signature is what makes the schema open. `getDriveLintConfigObject`
 * answers with the parsed file unvalidated, so `indentation` - a formatter
 * setting, not a lint rule, and deliberately not in the named list - reaches the
 * client exactly as the author wrote it. Without this, tsoa emits
 * `additionalProperties: false` and a client that validates responses rejects an
 * ordinary answer.
 */
export interface LintConfigJson extends Partial<LintConfigSettings> {
  [setting: string]: unknown
}
