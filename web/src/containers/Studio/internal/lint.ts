import axios from 'axios'
import * as monaco from 'monaco-editor'

import { LINT_MARKER_OWNER, toMarkers } from './lintMarkers'

/**
 * Lints SAS code and marks the model with what comes back.
 *
 * The code is submitted rather than named as a path, so this lints the buffer,
 * including unsaved changes, and no drive permission is involved. Nothing is
 * executed. When the buffer belongs to a file on the drive, its path names
 * that file so the rules come from the nearest `.sasjslint` at or above the
 * file's folder; an untitled buffer lints against the drive-root rules file.
 *
 * A failure leaves the model unmarked rather than raising a dialog: the editor
 * stays usable, and an absent squiggle interrupts less than a modal.
 */
export const lintModel = async (
  model: monaco.editor.ITextModel | null,
  code: string,
  filePath?: string
): Promise<monaco.editor.IMarkerData[]> => {
  if (!model) return []

  try {
    const markers = toMarkers(
      (await axios.post('/SASjsApi/code/lint', { code, filePath })).data
    )

    monaco.editor.setModelMarkers(model, LINT_MARKER_OWNER, markers)

    // Returned as well as applied: the Code tab lists exactly what Monaco was
    // given, so the panel and the squiggles cannot disagree.
    return markers
  } catch {
    monaco.editor.setModelMarkers(model, LINT_MARKER_OWNER, [])

    return []
  }
}
