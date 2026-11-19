import type { editor as MonacoEditor } from 'monaco-editor'
import { displayKindOf } from './displayMode'
import { lintAppliesTo } from './lintScope'
import type { SasFormatMode } from './format'
import { REVIEW_MODEL_SCHEME } from './reviewModel'

export type FormatContext = {
  path: string
  runtime: string
  mode: SasFormatMode
}

/** SAS rules apply to SAS buffers; JSON has formatting but no lint fixes. */
export function formatKindFor({ path, runtime, mode }: FormatContext) {
  if (lintAppliesTo(path, runtime)) return 'sas'
  if (mode === 'format' && displayKindOf(path) === 'json') return 'json'
  return null
}

export type FormatSnapshot = {
  model: MonacoEditor.ITextModel
  version: number
}

export function undoFormatting(
  editor: MonacoEditor.ICodeEditor,
  snapshot: FormatSnapshot & { before: string; after: string },
  isCurrent: () => boolean
): 'applied' | 'stale' | 'unavailable' {
  const model = editor.getModel()
  if (!model) return 'unavailable'
  if (
    !isCurrent() ||
    model !== snapshot.model ||
    model.getVersionId() !== snapshot.version ||
    model.getValue() !== snapshot.after
  )
    return 'stale'
  editor.pushUndoStop()
  const applied = editor.executeEdits('sasjs-undo-format', [
    {
      range: model.getFullModelRange(),
      text: snapshot.before,
      forceMoveMarkers: true
    }
  ])
  editor.pushUndoStop()
  return applied ? 'applied' : 'unavailable'
}

export type Review =
  | { kind: 'saved'; before: string }
  | ({
      kind: 'format'
      before: string
      after: string
      generation: number
    } & FormatSnapshot)

export function comparisonFor(review: Review, current: string) {
  return {
    before: review.before,
    after: review.kind === 'saved' ? current : review.after
  }
}

/** Apply a formatter response only to the exact model version it was sent from. */
export async function rewriteBuffer({
  editor,
  isCurrent,
  formatContext,
  format,
  onApplied
}: {
  editor: MonacoEditor.ICodeEditor
  isCurrent: () => boolean
  formatContext: FormatContext
  format: (text: string) => Promise<string>
  onApplied: (before: string, after: string, snapshot: FormatSnapshot) => void
}): Promise<'applied' | 'unchanged' | 'stale' | 'unavailable' | 'ineligible'> {
  if (!formatKindFor(formatContext)) return 'ineligible'
  const model = editor.getModel()
  if (!model) return 'unavailable'
  const before = model.getValue()
  const version = model.getVersionId()
  const after = await format(before)
  if (
    !isCurrent() ||
    editor.getModel() !== model ||
    model.getVersionId() !== version ||
    model.getValue() !== before
  )
    return 'stale'
  if (before === after) return 'unchanged'
  editor.pushUndoStop()
  const applied = editor.executeEdits('sasjs-format', [
    { range: model.getFullModelRange(), text: after, forceMoveMarkers: true }
  ])
  editor.pushUndoStop()
  if (!applied) return 'unavailable'
  onApplied(before, after, { model, version: model.getVersionId() })
  return 'applied'
}

/** Format and save the same model snapshot; never write after an intervening edit. */
export async function saveSnapshot({
  editor,
  isCurrent,
  formatContext,
  format,
  write,
  onFormatted
}: {
  editor: MonacoEditor.ICodeEditor
  isCurrent: () => boolean
  formatContext: FormatContext
  format?: (text: string) => Promise<string>
  write: (text: string) => Promise<void>
  onFormatted: (before: string, after: string, snapshot: FormatSnapshot) => void
}): Promise<'saved' | 'stale' | 'unavailable'> {
  const initial = editor.getModel()
  if (!initial) return 'unavailable'
  let expectedVersion = initial.getVersionId()
  if (format) {
    const result = await rewriteBuffer({
      editor,
      isCurrent,
      formatContext,
      format: async (text) => {
        try {
          return await format(text)
        } catch {
          return text
        }
      },
      onApplied: (before, after, snapshot) => {
        expectedVersion = initial.getVersionId()
        onFormatted(before, after, snapshot)
      }
    })
    if (
      result === 'stale' ||
      result === 'unavailable' ||
      result === 'ineligible'
    )
      return result === 'ineligible' ? 'unavailable' : result
  }
  const model = editor.getModel()
  if (!model) return 'unavailable'
  if (
    !isCurrent() ||
    model !== initial ||
    model.getVersionId() !== expectedVersion
  )
    return 'stale'
  await write(model.getValue())
  return 'saved'
}

let nextReviewModelId = 0

/** A review owns its models; it never edits or disposes the live editor's model. */
export function createReview(
  monaco: typeof import('monaco-editor'),
  element: HTMLElement,
  before: string,
  after: string,
  language: string
): () => void {
  const createSnapshot = (text: string) =>
    monaco.editor.createModel(
      text,
      language,
      monaco.Uri.from({
        scheme: REVIEW_MODEL_SCHEME,
        path: `/snapshot-${nextReviewModelId++}`
      })
    )
  const original = createSnapshot(before)
  let modified: MonacoEditor.ITextModel | undefined
  let diff: MonacoEditor.IStandaloneDiffEditor | undefined
  try {
    modified = createSnapshot(after)
    diff = monaco.editor.createDiffEditor(element, {
      automaticLayout: true,
      readOnly: true,
      originalEditable: false,
      renderSideBySide: false,
      ignoreTrimWhitespace: false,
      renderMarginRevertIcon: false,
      minimap: { enabled: false }
    })
    diff.setModel({ original, modified })
  } catch (error) {
    diff?.dispose()
    modified?.dispose()
    original.dispose()
    throw error
  }
  return () => {
    diff.dispose()
    original.dispose()
    modified.dispose()
  }
}
