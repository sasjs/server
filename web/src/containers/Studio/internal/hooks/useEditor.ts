import axios from 'axios'
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'
import { EditorDidMount, monaco } from 'react-monaco-editor'
import { SelectChangeEvent } from '@mui/material'
import { getSelection, programPathInjection } from '../helper'
import { bindSaveShortcut, createSaveKeyHandler } from '../saveShortcut'
import { AppContext, RunTimeType } from '../../../../context/appContext'
import { applyRunTimeSelection } from '../runTime'
import { extensionOf } from '../../../../utils/files'
import { AlertSeverityType } from '../../../../components/snackbar'
import {
  useModal,
  useSnackbar,
  useStateWithCallback
} from '../../../../utils/hooks'
import {
  asImageBlob,
  countLines,
  isImageFile,
  parseErrorsAndWarnings,
  LogObject,
  parseExecutionResponse
} from '../../../../utils'
import { applyLintMarkers, clearLintModel, lintModel } from '../lint'
import { lintAppliesTo } from '../lintScope'
import { formatSasCode } from '../format'
import { prettyJson } from '../pretty'
import { guardMousePaste } from '../mousePasteGuard'
import { readSettings } from '../settings'

type UseEditorParams = {
  selectedFilePath: string
  setSelectedFilePath: (filePath: string, refreshSideBar?: boolean) => void
  setTab: Dispatch<SetStateAction<string>>
}

const useEditor = ({
  selectedFilePath,
  setSelectedFilePath,
  setTab
}: UseEditorParams) => {
  const appContext = useContext(AppContext)
  const { Dialog, setOpenModal, setModalTitle, setModalPayload } = useModal()
  const { Snackbar, setOpenSnackbar, setSnackbarMessage, setSnackbarSeverity } =
    useSnackbar()
  const [isLoading, setIsLoading] = useState(false)
  const [prevFileContent, setPrevFileContent] = useStateWithCallback('')
  const [fileContent, setFileContent] = useState('')
  const [log, setLog] = useState<LogObject | string>()
  const [webout, setWebout] = useState<string>()
  const [printOutput, setPrintOutput] = useState<string>()
  const [runTimes, setRunTimes] = useState<string[]>([])
  const [selectedRunTime, setSelectedRunTime] = useState<RunTimeType>(
    RunTimeType.SAS
  )
  const [selectedFileExtension, setSelectedFileExtension] = useState('')
  const [openFilePathInputModal, setOpenFilePathInputModal] = useState(false)
  // A picture opens as a URL for its own bytes: the drive endpoint needs the
  // session, so the file is fetched as a blob rather than pointed at directly.
  const [imageUrl, setImageUrl] = useState('')

  /**
   * What the last lint found, for the Code tab's issue list.
   *
   * The markers themselves, so the list is a view of the same set Monaco paints
   * with - never a second lint that could disagree with the squiggles.
   */
  const [lintMarkers, setLintMarkers] = useState<monaco.editor.IMarkerData[]>(
    []
  )

  /**
   * The file the panel describes.
   *
   * A lint request outlives the switch that follows it, so the answer is checked
   * against this before it is shown - see `lint`.
   */
  const selectedFilePathRef = useRef(selectedFilePath)

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  // Detaches the mouse-paste guard from the editor that was unmounted, so a
  // remount (the diff view toggling) does not leave a listener behind.
  const releaseMousePasteGuard = useRef<(() => void) | null>(null)

  const handleEditorDidMount: EditorDidMount = (editor) => {
    editorRef.current = editor
    editor.focus()

    releaseMousePasteGuard.current?.()

    const node = editor.getDomNode()
    if (node) releaseMousePasteGuard.current = guardMousePaste(node)
  }

  /**
   * Whether a format request is in flight.
   *
   * The button is disabled while one is: two clicks race, and the second answer
   * would replace a buffer the first had already formatted.
   */
  const [formatting, setFormatting] = useState(false)

  /**
   * Applies the `.sasjslint` formatting rules to the buffer.
   *
   * Three things this has to get right, and the first version got none of them:
   *
   * - the buffer is submitted, so unsaved edits are formatted, and nothing
   *   reaches the drive until Save
   * - the answer is applied only if the buffer still holds the text that was
   *   sent. The request takes as long as the server needs to read the rules
   *   file, and replacing the whole controlled value on return would discard
   *   whatever was typed meanwhile
   * - a failure is said out loud. The formatter rejects rather than returning
   *   the text unchanged precisely so the caller can surface it; swallowing it
   *   left the user pressing a button that did nothing
   */
  const fixFormatting = useCallback(async () => {
    if (formatting) return

    const sent = fileContent

    setFormatting(true)

    try {
      const formatted = await formatSasCode(sent, selectedFilePath || undefined)

      if (formatted === sent) {
        setSnackbarMessage('Already formatted.')
        setSnackbarSeverity(AlertSeverityType.Info)
        setOpenSnackbar(true)

        return
      }

      // Only if nothing was typed while the formatter was away.
      setFileContent((current) => (current === sent ? formatted : current))

      if (fileContent === sent) {
        setSnackbarMessage('Formatting applied.')
        setSnackbarSeverity(AlertSeverityType.Success)
        setOpenSnackbar(true)
      }
    } catch (error) {
      setSnackbarMessage('The formatter could not run. Your code is unchanged.')
      setSnackbarSeverity(AlertSeverityType.Error)
      setOpenSnackbar(true)

      console.log(error)
    } finally {
      setFormatting(false)
    }
  }, [
    fileContent,
    formatting,
    selectedFilePath,
    setFileContent,
    setOpenSnackbar,
    setSnackbarMessage,
    setSnackbarSeverity
  ])

  const saveFile = useCallback(
    (filePath?: string, content?: string) => {
      // The buffer holds text, so writing it over a picture would replace the
      // image with an empty file. The file menu is hidden for a picture, and
      // this keeps any other route to a save from truncating one.
      const target = filePath ?? selectedFilePath

      if (isImageFile(target)) {
        setSnackbarMessage('A picture cannot be edited here.')
        setSnackbarSeverity(AlertSeverityType.Warning)
        setOpenSnackbar(true)

        return
      }

      setIsLoading(true)

      // The caller may hand in the text it just formatted; otherwise the
      // buffer as React knows it is saved. Formatting applies its edits to
      // the model first, so the two can differ for one render.
      const text = content ?? fileContent

      if (filePath) {
        filePath = filePath.startsWith('/') ? filePath : `/${filePath}`
      }

      const formData = new FormData()

      const stringBlob = new Blob([text], { type: 'text/plain' })
      formData.append('file', stringBlob)
      formData.append('filePath', filePath ?? selectedFilePath)

      const axiosPromise = filePath
        ? axios.post('/SASjsApi/drive/file', formData)
        : axios.patch('/SASjsApi/drive/file', formData)

      axiosPromise
        .then(() => {
          if (filePath && text === prevFileContent) {
            // when fileContent and prevFileContent is same,
            // callback function in setPrevFileContent method is not called
            // because behind the scene useEffect hook is being used
            // for calling callback function, and it's only fired when the
            // new value is not equal to old value.
            // So, we'll have to explicitly update the selected file path

            setSelectedFilePath(filePath, true)
          } else {
            setPrevFileContent(text, () => {
              if (filePath) {
                setSelectedFilePath(filePath, true)
              }
            })
          }
          setSnackbarMessage('File saved!')
          setSnackbarSeverity(AlertSeverityType.Success)
          setOpenSnackbar(true)
        })
        .catch((err) => {
          setModalTitle('Abort')
          setModalPayload(
            typeof err.response.data === 'object'
              ? JSON.stringify(err.response.data)
              : err.response.data
          )
          setOpenModal(true)
        })
        .finally(() => {
          setIsLoading(false)
        })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fileContent, prevFileContent, selectedFilePath]
  )

  const handleTabChange = (_e: any, newValue: string) => {
    setTab(newValue)
  }

  /**
   * Moves the cursor to a line and scrolls it into view.
   *
   * The log's issue list and the Code tab's lint list both jump this way, so a
   * finding is one click from the text it is about.
   */
  const revealLine = useCallback((lineNumber: number) => {
    const editor = editorRef.current

    if (!editor) return

    editor.revealLineInCenter(lineNumber)
    editor.setPosition({ lineNumber, column: 1 })
    editor.focus()
  }, [])

  const handleRunBtnClick = () =>
    runCode(getSelection(editorRef.current as any) || fileContent)

  const runCode = useCallback(
    (code: string) => {
      setIsLoading(true)

      // Scroll to bottom of log
      const logElement = document.getElementById('log')
      if (logElement) logElement.scrollTop = logElement.scrollHeight

      setIsLoading(false)

      axios
        .post(`/SASjsApi/code/execute`, {
          code: programPathInjection(
            code,
            selectedFilePath,
            selectedRunTime as RunTimeType
          ),
          runTime: selectedRunTime
        })
        .then((res: { data: string }) => {
          // INFO: the order of payload parts is set in @sasjs/server/api/src/controllers/internal/Execution.ts
          const { webout, log, printOutput } = parseExecutionResponse(res.data)

          let hasErrors = false

          if (selectedRunTime === RunTimeType.SAS) {
            const { errors, warnings, notes } = parseErrorsAndWarnings(log)

            hasErrors = errors.length > 0

            const logObject: LogObject = {
              body: log,
              errors,
              warnings,
              notes,
              linesCount: countLines(log)
            }

            setLog(logObject)
          } else {
            setLog(log)
          }

          setWebout(webout)
          setPrintOutput(printOutput)

          // Where a successful run leaves the reader: an error is the one thing
          // to read first, so the log wins when there is one; with none, the
          // output the program produced is what the run was for, and the webout
          // is the page it wrote - print output only when there is no page. A
          // run with neither lands on the log, which is all it had.
          setTab(
            hasErrors
              ? 'log'
              : webout
                ? 'webout'
                : printOutput
                  ? 'printOutput'
                  : 'log'
          )

          // Scroll to bottom of log
          const logElement = document.getElementById('log')
          if (logElement) logElement.scrollTop = logElement.scrollHeight
        })
        .catch((err) => {
          setModalTitle('Abort')
          setModalPayload(
            typeof err.response.data === 'object'
              ? JSON.stringify(err.response.data)
              : err.response.data
          )
          setOpenModal(true)
        })
        .finally(() => setIsLoading(false))
    },
    [
      selectedFilePath,
      selectedRunTime,
      setModalPayload,
      setModalTitle,
      setOpenModal,
      setTab
    ]
  )

  const handleChangeRunTime = (event: SelectChangeEvent) => {
    setSelectedRunTime(event.target.value as RunTimeType)
  }

  const handleFilePathInput = (filePath: string) => {
    setOpenFilePathInputModal(false)
    saveFile(filePath)
  }

  /**
   * Whether the buffer holds a SAS program.
   *
   * The same question the lint flow asks, from the same helper: the model's
   * language id is not consulted, because the editor sets it from the extension
   * (`getLanguageFromExtension`) - a second copy of an answer that would then
   * drift from this one. An untitled buffer mounts as plaintext, which is the
   * case the selected run time covers.
   */
  const isSasBuffer = useCallback(
    () => lintAppliesTo(selectedFilePath, selectedRunTime),
    [selectedFilePath, selectedRunTime]
  )

  /**
   * Formats the buffer and applies the result to the editor model, returning
   * the text the buffer now holds. Formatting only applies when the buffer
   * holds a SAS program: the api applies SAS rules, so a program in another
   * runtime stays exactly as typed. A formatting failure returns the buffer
   * untouched - the caller's action (save or format) proceeds with what is
   * there.
   */
  const formatBuffer = useCallback(
    async (editor: monaco.editor.ICodeEditor) => {
      if (!isSasBuffer()) return

      const model = editor.getModel()
      if (!model) return

      const code = model.getValue()

      let formatted = code
      try {
        // The buffer's file, when it has one, names the file whose tree the
        // rules resolve from - the same path the lint flow passes.
        formatted = await formatSasCode(code, selectedFilePath || undefined)
      } catch {
        return
      }

      if (formatted === code) return

      editor.pushUndoStop()
      editor.executeEdits('sasjs-format', [
        {
          range: model.getFullModelRange(),
          text: formatted,
          forceMoveMarkers: true
        }
      ])
      editor.pushUndoStop()

      return formatted
    },
    [isSasBuffer, selectedFilePath]
  )

  /**
   * Saves the buffer the way Ctrl+S does: the text is formatted first when the
   * setting asks for it, and the model's own text is what gets written, because
   * React's copy of the buffer lags a formatting edit by one render.
   */
  const saveBuffer = useCallback(async () => {
    if (!selectedFilePath) {
      setOpenFilePathInputModal(true)

      return
    }

    const editor = editorRef.current
    const content =
      editor && readSettings()['editor.formatOnSave']
        ? await formatBuffer(editor)
        : undefined

    const text = content ?? editor?.getModel()?.getValue()

    if (text !== undefined && prevFileContent !== text)
      saveFile(undefined, text)
  }, [selectedFilePath, formatBuffer, prevFileContent, saveFile])

  /**
   * Ctrl+S anywhere in Studio.
   *
   * Monaco's action covers the key while the editor has focus; with focus in the file tree,
   * the log or a dialog it reached the browser instead, which offered to save the page. This
   * listener covers those, and `createSaveKeyHandler` keeps the two from both firing.
   */
  useEffect(() => {
    const onKeyDown = createSaveKeyHandler({
      save: () => void saveBuffer(),
      hasFocus: () => editorRef.current?.hasTextFocus() ?? false
    })

    return bindSaveShortcut(document, onKeyDown)
  }, [saveBuffer])

  useEffect(() => {
    const saveFileAction = editorRef.current?.addAction({
      // An unique identifier of the contributed action.
      id: 'save-file',

      // A label of the action that will be presented to the user.
      label: 'Save',

      // An optional array of keybindings for the action.
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],

      contextMenuGroupId: '9_cutcopypaste',

      // Method that will be executed when the action is triggered.
      // @param editor The editor instance is passed in as a convenience
      run: () => void saveBuffer()
    })

    const formatAction = editorRef.current?.addAction({
      // An unique identifier of the contributed action.
      id: 'format-code',

      // A label of the action that will be presented to the user.
      label: 'Format Code',

      // An optional array of keybindings for the action.
      keybindings: [
        monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF
      ],

      contextMenuGroupId: 'navigation',

      // Method that will be executed when the action is triggered.
      // @param editor The editor instance is passed in as a convenience
      run: async (ed) => {
        await formatBuffer(ed)
        setSnackbarMessage('Code formatted!')
        setSnackbarSeverity(AlertSeverityType.Success)
        setOpenSnackbar(true)
      }
    })

    const runCodeAction = editorRef.current?.addAction({
      // An unique identifier of the contributed action.
      id: 'run-code',

      // A label of the action that will be presented to the user.
      label: 'Run Code',

      // An optional array of keybindings for the action.
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],

      contextMenuGroupId: 'navigation',

      // Method that will be executed when the action is triggered.
      // @param editor The editor instance is passed in as a convenience
      run: function () {
        runCode(getSelection(editorRef.current as any) || fileContent)
      }
    })

    return () => {
      saveFileAction?.dispose()
      formatAction?.dispose()
      runCodeAction?.dispose()
    }
  }, [
    fileContent,
    prevFileContent,
    selectedFilePath,
    saveFile,
    saveBuffer,
    runCode,
    formatBuffer,
    setOpenSnackbar,
    setSnackbarMessage,
    setSnackbarSeverity
  ])

  // The guard listens on the editor's own DOM node, which the unmount removes
  // anyway; detaching keeps a stale listener from holding the node alive.
  useEffect(() => () => releaseMousePasteGuard.current?.(), [])

  useEffect(() => {
    setRunTimes(Object.values(appContext.runTimes))
  }, [appContext.runTimes])

  // The file in front of the user decides its run time, not a remembered selection and not
  // whichever run time happens to arrive first: a host that offers `js,sas` would otherwise
  // run a `.sas` file as JavaScript whenever the list refreshed after the file was opened.
  // An extension the host does not offer falls back to its first run time, which is the
  // priority `RUN_TIMES` documents.
  useEffect(() => {
    applyRunTimeSelection(
      (runTime) => setSelectedRunTime(runTime as RunTimeType),
      selectedFilePath,
      runTimes
    )
  }, [selectedFilePath, runTimes])

  useEffect(() => {
    if (selectedFilePath) {
      setIsLoading(true)
      setSelectedFileExtension(extensionOf(selectedFilePath))

      if (isImageFile(selectedFilePath)) {
        // A picture is shown, not edited: its bytes become a blob URL and the
        // editor's buffer stays empty, so nothing can save over the image.
        setFileContent('')
        setPrevFileContent('')

        axios
          .get(`/SASjsApi/drive/file?_filePath=${selectedFilePath}`, {
            responseType: 'blob'
          })
          // the drive types every non-text file as octet-stream, which
          // `<img>` will not draw an SVG from: the blob is re-typed from the
          // file's own extension before it becomes an object URL
          .then((res: any) =>
            setImageUrl(
              URL.createObjectURL(asImageBlob(res.data, selectedFilePath))
            )
          )
          .catch((err) => {
            setModalTitle('Abort')
            setModalPayload(
              typeof err.response?.data === 'object'
                ? JSON.stringify(err.response.data)
                : err.response?.data
            )
            setOpenModal(true)
          })
          .finally(() => setIsLoading(false))

        setWebout('')
        setTab('code')

        return
      }

      setImageUrl('')

      axios
        .get(`/SASjsApi/drive/file?_filePath=${selectedFilePath}`, {
          // Ask for the file as text whatever its type. axios otherwise parses
          // a JSON file into an object, and stringifying that back minifies it,
          // so a prettified file on the drive opened in the editor with its
          // formatting stripped. The whitespace below is the file's own; only a
          // minified JSON file is re-indented for display.
          responseType: 'text'
        })
        .then((res: any) => {
          // A JSON file is usually stored minified, which is one long line in
          // the editor. It opens indented instead, and indented is what it
          // holds, so the buffer starts clean and the drive keeps the file it
          // has until the user saves.
          const content =
            extensionOf(selectedFilePath) === 'json'
              ? prettyJson(res.data)
              : res.data

          setPrevFileContent(content)
          setFileContent(content)

          // Opening a file is opening it for typing: with focus left on the tree the next
          // keystroke goes nowhere, which is what made a newly added file feel inert.
          editorRef.current?.focus()
        })
        .catch((err) => {
          setModalTitle('Abort')
          setModalPayload(
            typeof err.response.data === 'object'
              ? JSON.stringify(err.response.data)
              : err.response.data
          )
          setOpenModal(true)
        })
        .finally(() => setIsLoading(false))
    } else {
      // A buffer with no file behind it is restored from local storage, and
      // that restored text is its baseline: the dot on the save icon means
      // edits made in this session, not the absence of a file on the drive.
      const content = localStorage.getItem('fileContent') ?? ''
      setPrevFileContent(content)
      setFileContent(content)
      setImageUrl('')
    }
    selectedFilePathRef.current = selectedFilePath
    setWebout('')
    setTab('code')
    /* And the lint panel empties with the file. It lists findings about the
       buffer that was open, so leaving it up describes the new file in the old
       file's terms - the case that reported a .js file with "Line exceeds
       maximum length by 1 characters", which is a SAS column rule. */
    setLintMarkers([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilePath])

  // The image's bytes live until the next file is opened, and no longer.
  useEffect(() => {
    if (!imageUrl) return

    return () => URL.revokeObjectURL(imageUrl)
  }, [imageUrl])

  useEffect(() => {
    if (fileContent.length && !selectedFilePath) {
      localStorage.setItem('fileContent', fileContent)
    }
  }, [fileContent, selectedFilePath])

  /**
   * Lints SAS code and marks the editor with the findings.
   *
   * The endpoint applies SAS rules, so a program in another runtime is left
   * unmarked rather than reported against rules that do not apply to it. A
   * buffer with no path is judged by the run time the user selected.
   *
   * A buffer the rules do not apply to CLEARS what the panel holds rather than
   * returning quietly: the panel is state, so it outlives the file the findings
   * described, and a .js file opened after a .sas program was reported with that
   * program's findings.
   */
  const lint = useCallback(
    (code: string, filePath?: string) => {
      if (!lintAppliesTo(filePath ?? '', selectedRunTime) || !code) {
        clearLintModel(editorRef.current?.getModel() ?? null)
        setLintMarkers([])

        return
      }

      // The file's own path drives the `.sasjslint` resolution on the server,
      // so the buffer is judged by the rules that apply where it lives.
      const requestedFor = filePath ?? ''

      void lintModel(code, filePath || undefined).then((markers) => {
        /* A lint outlives a file switch: the answer for the previous buffer can
           arrive after the next one is open, and painting it would put that
           file's findings back for a debounce - the symptom this flow exists to
           avoid. The answer is dropped unless it describes what is open now. */
        if (requestedFor !== selectedFilePathRef.current) return

        applyLintMarkers(editorRef.current?.getModel() ?? null, markers)
        setLintMarkers(markers)
      })
    },
    [selectedRunTime]
  )

  /**
   * Re-measures the editor when the lint panel appears or disappears.
   *
   * Monaco caches its container's size and only re-measures on a window
   * resize, so a panel opening above the editor leaves it drawing at the old
   * height - taller than the space it now has. The panel's presence is the one
   * thing that changes the editor's container without a window resize.
   */
  useEffect(() => {
    editorRef.current?.layout()
  }, [lintMarkers.length === 0])

  useEffect(() => {
    // Linting the buffer on a delay keeps a request off the keystroke path,
    // and the cleanup cancels the pending one as soon as typing continues.
    const timer = setTimeout(() => lint(fileContent, selectedFilePath), 500)

    return () => clearTimeout(timer)
  }, [fileContent, selectedFilePath, lint])

  return {
    fileContent,
    imageUrl,
    lintMarkers,
    revealLine,
    isLoading,
    log,
    openFilePathInputModal,
    prevFileContent,
    runTimes,
    selectedFileExtension,
    selectedRunTime,
    webout,
    printOutput,
    Dialog,
    handleChangeRunTime,
    handleEditorDidMount,
    handleFilePathInput,
    handleRunBtnClick,
    handleTabChange,
    saveBuffer,
    fixFormatting,
    formatting,
    saveFile,
    setOpenFilePathInputModal,
    setFileContent,
    Snackbar
  }
}

export default useEditor
