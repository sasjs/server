import axios from 'axios'
import * as monaco from 'monaco-editor'

import { LINT_MARKER_OWNER, toMarkers } from './lintMarkers'

/**
 * Lints SAS code and returns what the editor should show.
 *
 * The code is submitted rather than named as a path, so this lints the buffer,
 * including unsaved changes, and no drive permission is involved. Nothing is
 * executed. When the buffer belongs to a file on the drive, its path names
 * that file so the rules come from the nearest `.sasjslint` at or above the
 * file's folder; an untitled buffer lints against the drive-root rules file.
 *
 * The answer is returned rather than painted here: the request outlives a file
 * switch, so the caller decides whether it still describes the buffer that is
 * open before it marks anything.
 *
 * A failure is an empty set rather than a dialog: the editor stays usable, and
 * an absent squiggle interrupts less than a modal.
 */
export const lintModel = async (
  code: string,
  filePath?: string
): Promise<monaco.editor.IMarkerData[]> => {
  try {
    return toMarkers(
      (await axios.post('/SASjsApi/code/lint', { code, filePath })).data
    )
  } catch {
    return []
  }
}

/**
 * Puts a marker set on a model, replacing whatever the lint owner had there.
 *
 * The Code tab lists the same array, so the panel and the squiggles cannot
 * disagree: one answer, applied twice.
 */
export const applyLintMarkers = (
  model: monaco.editor.ITextModel | null,
  markers: monaco.editor.IMarkerData[]
): void => {
  if (!model) return

  monaco.editor.setModelMarkers(model, LINT_MARKER_OWNER, markers)
}

/**
 * Takes the markers off a model, so nothing the panel no longer lists keeps a
 * squiggle under the code.
 *
 * A model's markers outlive the buffer being open: Monaco holds them until
 * something replaces them, and a buffer the rules do not apply to never gets a
 * second lint to write over them.
 */
export const clearLintModel = (model: monaco.editor.ITextModel | null): void =>
  applyLintMarkers(model, [])
