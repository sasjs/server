import { Diagnostic, lintText } from '@sasjs/lint'

/**
 * Lints SAS program content and returns the diagnostics.
 *
 * The content arrives in the request rather than as a path, so nothing is read
 * from disk: a caller lints the buffer it is editing, and no drive permission
 * is involved. Rules come from the nearest `.sasjslint` above the server's
 * working directory, falling back to the package default - the same resolution
 * the CLI and the VS Code extension use.
 */
export const lintProgram = async (content: string): Promise<Diagnostic[]> =>
  lintText(content)
