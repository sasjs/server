import type * as monaco from 'monaco-editor'

export const LINT_MARKER_OWNER = 'sasjs-lint'

/**
 * Monaco marker severities, mirrored so that this module carries no runtime
 * dependency on the editor and the mapping below can be tested outside a
 * browser. The values match monaco.MarkerSeverity.
 */
const INFO = 2 as monaco.MarkerSeverity
const WARNING = 4 as monaco.MarkerSeverity
const ERROR = 8 as monaco.MarkerSeverity

/**
 * A diagnostic as returned by `GET /SASjsApi/drive/lint`.
 *
 * Severity follows `@sasjs/lint`: 0 info, 1 warning, 2 error.
 */
export type LintDiagnostic = {
  lineNumber: number
  startColumnNumber: number
  endColumnNumber: number
  message: string
  severity: number
}

const markerSeverity = (severity: number): monaco.MarkerSeverity => {
  if (severity === 0) return INFO
  if (severity === 2) return ERROR
  return WARNING
}

/**
 * Converts lint diagnostics into Monaco markers.
 *
 * Line and column are 1-based on both sides, but a lint rule reports the LAST
 * offending character while a Monaco marker end is exclusive, so the end column
 * advances by one. Without that, a single character violation renders as a zero
 * width marker.
 */
export const toMarkers = (
  diagnostics: LintDiagnostic[]
): monaco.editor.IMarkerData[] =>
  diagnostics.map((diagnostic) => ({
    startLineNumber: diagnostic.lineNumber,
    startColumn: diagnostic.startColumnNumber,
    endLineNumber: diagnostic.lineNumber,
    endColumn: diagnostic.endColumnNumber + 1,
    message: diagnostic.message,
    severity: markerSeverity(diagnostic.severity)
  }))
