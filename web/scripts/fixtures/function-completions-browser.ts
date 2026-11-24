import * as monaco from 'monaco-editor'
import { registerSasCompletions } from '../../src/containers/Studio/internal/languages/completions'

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
