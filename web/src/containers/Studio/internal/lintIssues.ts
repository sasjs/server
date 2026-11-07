import type * as monaco from 'monaco-editor'

/**
 * Monaco's marker severities, mirrored so this module carries no runtime
 * dependency on the editor and can be tested outside a browser.
 */
export const SEVERITY_HINT = 1
export const SEVERITY_INFO = 2
export const SEVERITY_WARNING = 4
export const SEVERITY_ERROR = 8

/** One finding, as the list renders it. */
export interface LintIssue {
  lineNumber: number
  message: string
  severity: number
}

export interface LintSummary {
  /** Every finding, in the order the editor holds them: grouped by line. */
  issues: LintIssue[]
  errors: number
  warnings: number
  infos: number
  hints: number
}

/**
 * The lint findings as the Code tab lists them.
 *
 * The list and the squiggles come from one marker set, so they cannot disagree:
 * this is a summary of what Monaco was handed, not a second lint. Findings keep
 * the editor's order, which is by position - reading down the list follows the
 * buffer.
 */
export const summariseLintIssues = (
  markers: monaco.editor.IMarkerData[]
): LintSummary => {
  const issues = markers.map((marker) => ({
    lineNumber: marker.startLineNumber,
    message: marker.message,
    severity: marker.severity
  }))

  return {
    issues,
    errors: issues.filter((issue) => issue.severity === SEVERITY_ERROR).length,
    warnings: issues.filter((issue) => issue.severity === SEVERITY_WARNING)
      .length,
    infos: issues.filter((issue) => issue.severity === SEVERITY_INFO).length,
    hints: issues.filter((issue) => issue.severity === SEVERITY_HINT).length
  }
}

/**
 * The one-line summary above the list: "2 errors, 1 warning".
 *
 * Pluralised per count, and the severities in the order a reader triages them.
 */
export const describeLintSummary = (summary: LintSummary): string => {
  const parts = [
    [summary.errors, 'error'],
    [summary.warnings, 'warning'],
    [summary.infos, 'info'],
    [summary.hints, 'hint']
  ] as [number, string][]

  return parts
    .filter(([count]) => count > 0)
    .map(([count, noun]) => `${count} ${noun}${count === 1 ? '' : 's'}`)
    .join(', ')
}
