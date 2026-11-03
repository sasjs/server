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
import { DiffEditorDidMount, EditorDidMount, monaco } from 'react-monaco-editor'
import { SelectChangeEvent } from '@mui/material'
import { getSelection, programPathInjection } from '../helper'
import { AppContext, RunTimeType } from '../../../../context/appContext'
import { AlertSeverityType } from '../../../../components/snackbar'
import {
  useModal,
  useSnackbar,
  useStateWithCallback
} from '../../../../utils/hooks'
import {
  parseErrorsAndWarnings,
  countLines,
  isImageFile,
  LogObject
} from '../../../../utils'
import { lintModel } from '../lint'
import { formatSasCode } from '../format'
import { prettyJson } from '../pretty'
import { guardMousePaste } from '../mousePasteGuard'
import { readSettings } from '../settings'

const SASJS_LOGS_SEPARATOR =
  'SASJS_LOGS_SEPARATOR_163ee17b6ff24f028928972d80a26784'

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
  const [showDiff, setShowDiff] = useState(false)
  // A picture opens as a URL for its own bytes: the drive endpoint needs the
  // session, so the file is fetched as a blob rather than pointed at directly.
  const [imageUrl, setImageUrl] = useState('')

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

    editor.addAction({
      // An unique identifier of the contributed action.
      id: 'show-difference',

      // A label of the action that will be presented to the user.
      label: 'Show Differences',

      // An optional array of keybindings for the action.
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD],

      contextMenuGroupId: 'navigation',

      contextMenuOrder: 1,

      // Method that will be executed when the action is triggered.
      // @param editor The editor instance is passed in as a convenience
      run: function (ed) {
        setShowDiff(true)
      }
    })
  }

  const handleDiffEditorDidMount: DiffEditorDidMount = (diffEditor) => {
    diffEditor.focus()
    diffEditor.addCommand(monaco.KeyCode.Escape, function () {
      setShowDiff(false)
    })
  }

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
          const resDataSplitted = res.data.split(SASJS_LOGS_SEPARATOR)
          const webout = resDataSplitted[0]
          const log = resDataSplitted[1]
          const printOutput = resDataSplitted[2]

          if (selectedRunTime === RunTimeType.SAS) {
            const { errors, warnings, notes } = parseErrorsAndWarnings(log)

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
          setTab('log')

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
   * Whether the buffer holds a SAS program. The model's language tells it for
   * a file opened from the drive; an untitled buffer mounts as plaintext, so
   * there the selected runtime decides - the same signal the lint flow uses.
   */
  const isSasBuffer = useCallback(() => {
    const model = editorRef.current?.getModel()
    if (model && model.getLanguageId() !== 'plaintext') {
      return model.getLanguageId() === 'sas'
    }

    if (selectedFilePath) {
      return selectedFilePath.split('.').pop()?.toLowerCase() === 'sas'
    }

    return selectedRunTime === RunTimeType.SAS
  }, [selectedFilePath, selectedRunTime])

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

  useEffect(() => {
    if (runTimes.length) setSelectedRunTime(runTimes[0] as RunTimeType)
  }, [runTimes])

  useEffect(() => {
    if (selectedFilePath) {
      setIsLoading(true)
      setSelectedFileExtension(
        selectedFilePath.split('.').pop()?.toLowerCase() ?? ''
      )

      if (isImageFile(selectedFilePath)) {
        // A picture is shown, not edited: its bytes become a blob URL and the
        // editor's buffer stays empty, so nothing can save over the image.
        setFileContent('')
        setPrevFileContent('')

        axios
          .get(`/SASjsApi/drive/file?_filePath=${selectedFilePath}`, {
            responseType: 'blob'
          })
          .then((res: any) => setImageUrl(URL.createObjectURL(res.data)))
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
            selectedFilePath.split('.').pop()?.toLowerCase() === 'json'
              ? prettyJson(res.data)
              : res.data

          setPrevFileContent(content)
          setFileContent(content)
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
    setWebout('')
    setTab('code')
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

  useEffect(() => {
    const fileExtension = selectedFileExtension.toLowerCase()

    if (runTimes.includes(fileExtension))
      setSelectedRunTime(fileExtension as RunTimeType)
  }, [selectedFileExtension, runTimes])

  /**
   * Lints SAS code and marks the editor with the findings.
   *
   * The endpoint applies SAS rules, so a program in another runtime is left
   * unmarked rather than reported against rules that do not apply to it. A
   * buffer with no path is judged by the run time the user selected.
   */
  const lint = useCallback(
    (code: string, filePath?: string) => {
      const isSas = filePath
        ? filePath.split('.').pop()?.toLowerCase() === 'sas'
        : selectedRunTime === RunTimeType.SAS

      if (!isSas || !code) return

      // The file's own path drives the `.sasjslint` resolution on the server,
      // so the buffer is judged by the rules that apply where it lives.
      void lintModel(
        editorRef.current?.getModel() ?? null,
        code,
        filePath || undefined
      )
    },
    [selectedRunTime]
  )

  useEffect(() => {
    // Linting the buffer on a delay keeps a request off the keystroke path,
    // and the cleanup cancels the pending one as soon as typing continues.
    const timer = setTimeout(() => lint(fileContent, selectedFilePath), 500)

    return () => clearTimeout(timer)
  }, [fileContent, selectedFilePath, lint])

  return {
    fileContent,
    imageUrl,
    isLoading,
    log,
    openFilePathInputModal,
    prevFileContent,
    runTimes,
    selectedFileExtension,
    selectedRunTime,
    showDiff,
    webout,
    printOutput,
    Dialog,
    handleChangeRunTime,
    handleDiffEditorDidMount,
    handleEditorDidMount,
    handleFilePathInput,
    handleRunBtnClick,
    handleTabChange,
    saveBuffer,
    saveFile,
    setShowDiff,
    setOpenFilePathInputModal,
    setFileContent,
    Snackbar
  }
}

export default useEditor
