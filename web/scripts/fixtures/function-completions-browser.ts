import * as monaco from 'monaco-editor'
import { registerSasCompletions } from '../../src/containers/Studio/internal/languages/completions'
import {
  connectSasLanguageServer,
  didOpen,
  didChange
} from '../../src/containers/Studio/internal/languages/connection'
import { provideDocumentFormattingEdits } from '../../src/containers/Studio/internal/languages/providers'

const workerUrl = new URL('@sasjs/sas-language/server/browser', import.meta.url)

monaco.languages.register({ id: 'sas' })
registerSasCompletions(monaco)
const editor = monaco.editor.create(document.getElementById('root')!, {
  value: 'atan2',
  language: 'sas',
  automaticLayout: true,
  suggest: { showWords: false }
})
editor.setPosition({ lineNumber: 1, column: 6 })
editor.focus()
;(window as any).testEditor = editor
;(window as any).testFormat = async (source: string) => {
  const { connection } = await connectSasLanguageServer(
    () => new Worker(workerUrl, { type: 'classic' })
  )
  const model = editor.getModel()!
  const uri = model.uri.toString()
  editor.setValue(source)
  didOpen(connection, uri, source)
  const format = async () => {
    const edits = await provideDocumentFormattingEdits(connection, model, {
      tabSize: 2,
      insertSpaces: true
    })
    model.pushEditOperations([], edits, () => null)
    return model.getValue()
  }
  const first = await format()
  didChange(connection, uri, first, model.getVersionId())
  const second = await format()
  return { first, second }
}
