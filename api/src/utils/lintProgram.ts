import { Diagnostic, LintConfig, lintText } from '@sasjs/lint'

/**
 * Lints SAS program content and returns the diagnostics.
 *
 * The content arrives in the request rather than as a path, so nothing is read
 * from disk: a caller lints the buffer it is editing, and no drive permission
 * is involved.
 *
 * The caller supplies the lint configuration the buffer must be judged
 * against; the drive-rooted `.sasjslint` resolution that provides it lives
 * with the code controller's other request concerns.
 */
export const lintProgram = async (
  content: string,
  configuration?: LintConfig
): Promise<Diagnostic[]> => lintText(content, configuration)
