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
import { parseErrorsAndWarnings, LogObject } from '../../../../utils'
import { lintModel } from '../lint'
import { formatSasCode } from '../format'
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

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  const handleEditorDidMount: EditorDidMount = (editor) => {
    editorRef.current = editor
    editor.focus()
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
            const { errors, warnings, logLines } = parseErrorsAndWarnings(log)

            const logObject: LogObject = {
              body: logLines.join(`\n`),
              errors,
              warnings,
              linesCount: logLines.length
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
        formatted = await formatSasCode(code)
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
    [isSasBuffer]
  )

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
      run: async (ed) => {
        if (!selectedFilePath) return setOpenFilePathInputModal(true)

        // Format on save is a setting, so a user who prefers the buffer as
        // typed keeps it. The formatted text is handed to the save directly:
        // the model already holds it, but React's copy of the buffer lags
        // the edit by one render.
        const content = readSettings()['editor.formatOnSave']
          ? await formatBuffer(ed)
          : undefined

        const modelValue = editorRef.current?.getModel()?.getValue()
        const text = content ?? modelValue

        if (prevFileContent !== text) return saveFile(undefined, text)
      }
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
    runCode,
    formatBuffer,
    setOpenSnackbar,
    setSnackbarMessage,
    setSnackbarSeverity
  ])

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
      axios
        .get(`/SASjsApi/drive/file?_filePath=${selectedFilePath}`, {
          // Ask for the file as text whatever its type. axios otherwise parses
          // a JSON file into an object, and stringifying that back minifies it,
          // so a prettified file on the drive opened in the editor with its
          // formatting stripped. The editor shows the file as it is stored.
          responseType: 'text'
        })
        .then((res: any) => {
          const content = res.data
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
      const content = localStorage.getItem('fileContent') ?? ''
      setFileContent(content)
    }
    setWebout('')
    setTab('code')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilePath])

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

      void lintModel(editorRef.current?.getModel() ?? null, code)
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
    saveFile,
    setShowDiff,
    setOpenFilePathInputModal,
    setFileContent,
    Snackbar
  }
}

export default useEditor
