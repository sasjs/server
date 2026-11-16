/**
 * A `.sasjslint` document: the rules as they sit on the drive.
 *
 * This is the payload `GET /SASjsApi/code/lint-config` answers with, and the
 * document a client hands to `new LintConfig(...)`. It is spelled out rather
 * than typed as `object` because tsoa reads this interface to write the
 * response schema: `object` emits `additionalProperties: false` with no
 * properties, which leaves a generated client unable to read a single field.
 *
 * The settings are `@sasjs/lint`'s own, so the schema they come from is the
 * one to compare against: `sasjslint-schema.json`. A spec does exactly that
 * (lintConfigSchema.spec.ts), so a rule added upstream fails the suite until
 * it is named here.
 */
export interface LintConfigJson {
  /** The schema an editor validates the file against, when the file names one. */
  $schema?: string
  /** Reports lines that contain a string listed in bannedStrings, such as a word that looks like... */
  noBannedStrings?: boolean
  /** Enforces no encoded passwords such as {SAS001} or {SASENC} in lines of SAS code */
  noEncodedPasswords?: boolean
  /** Enforces a Doxygen header at the start of each SAS file: a comment block that opens with... */
  hasDoxygenHeader?: boolean
  /** This sets the default program header - applies when a SAS program does NOT begin with `/**` */
  defaultHeader?: string
  /** Captures problematic characters such as zero-width whitespace and others that look valid but... */
  noGremlins?: boolean
  /** Reports %if used in open code - that is, outside every %macro definition in the file */
  noMacroIfInOpenCode?: boolean
  /** Reports a macro call whose argument list does not parse as written: a call that never closes... */
  noMalformedMacroCalls?: boolean
  /** An array of strings for the noBannedStrings rule to report */
  bannedStrings?: string[]
  /** An array of hex codes that represents allowed gremlins */
  allowedGremlins?: string[]
  /** Enforces the presence of macro names in %mend statements */
  hasMacroNameInMend?: boolean
  /** Enforces the presence of parentheses in macro definitions */
  hasMacroParentheses?: boolean
  /** Enforces a configurable multiple for the number of spaces for indentation */
  indentationMultiple?: number
  /** The case the formatter gives SAS keywords, once it is given a layout engine (see formatText) */
  keywordCase?: string
  /** Enforces no uppercase characters in file names */
  lowerCaseFileNames?: boolean
  /** Enforces no uppercase characters in macro names, in the <h4> SAS Macros </h4> header and in... */
  lowerCaseMacroNames?: boolean
  /** Enforces a configurable maximum line length */
  maxLineLength?: number
  /** Enforces a configurable maximum line length for header section */
  maxHeaderLineLength?: number
  /** Enforces a configurable maximum line length for data section */
  maxDataLineLength?: number
  /** Sets the shortest macro name the linter treats as a macro name, and the shortest a file may... */
  minMacroNameLength?: number
  /** Disallows a close marker inside the Doxygen header, which SAS reads as the end of the header... */
  noNestedCommentsInHeader?: boolean
  /** Enforces the absence of nested macro definitions */
  noNestedMacros?: boolean
  /** Enforces the absence of SAS comment statements that begin with a single asterisk, such as `*... */
  noSingleAsteriskComments?: boolean
  /** Enforces no spaces in file names */
  noSpacesInFileNames?: boolean
  /** Enforces no indentation using tabs */
  noTabs?: boolean
  /** Enforces no trailing spaces in lines of SAS code */
  noTrailingSpaces?: boolean
  /** Reports a warning for each macro a file invokes without declaring it in the `<h4> SAS Macros... */
  noUndeclaredMacros?: boolean
  /** Reports a warning for each macro declared in the `<h4> SAS Macros </h4>` section of the... */
  noUnusedMacros?: boolean
  /** Reports the statements and functions that run an operating system command, which need XCMD:... */
  noXcmd?: boolean
  /** Reports a warning for each libref a file assigns with a LIBNAME statement and never uses in... */
  noUnusedLibnames?: boolean
  /** Enforces the configured terminating character for each line, including the last one */
  lineEndings?: string
  /** Enforces Macro Definition syntax */
  strictMacroDefinition?: boolean
  /** An array of paths or path patterns to ignore when linting */
  ignoreList?: string[]
  /** An array of librefs that `noUnusedLibnames` leaves alone */
  ignoredLibnames?: string[]
  /** An array of macros that `noUndeclaredMacros` treats as declared: an entry is neither... */
  ignoredMacros?: string[]
  /** Enforces required macro options as defined by requiredMacroOptions */
  hasRequiredMacroOptions?: boolean
  /** An array of macro options to require all macros to include */
  requiredMacroOptions?: string[]
  /** An object which specifies the severity level of each rule */
  severityLevel?: Record<string, 'warn' | 'error'>
}
