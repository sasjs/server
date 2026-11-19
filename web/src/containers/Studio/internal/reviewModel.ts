import type { editor } from 'monaco-editor'

/** Comparison snapshots keep their language for syntax highlighting, but are
 * not documents that the SAS language server should open or query. */
export const REVIEW_MODEL_SCHEME = 'sasjs-review'

export const isReviewModel = (model: editor.ITextModel): boolean =>
  model.uri.scheme === REVIEW_MODEL_SCHEME
