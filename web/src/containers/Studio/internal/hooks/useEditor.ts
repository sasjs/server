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
    (filePath?: string) => {
      setIsLoading(true)

      if (filePath) {
        filePath = filePath.startsWith('/') ? filePath : `/${filePath}`
      }

      const formData = new FormData()

      const stringBlob = new Blob([fileContent], { type: 'text/plain' })
      formData.append('file', stringBlob)
      formData.append('filePath', filePath ?? selectedFilePath)

      const axiosPromise = filePath
        ? axios.post('/SASjsApi/drive/file', formData)
        : axios.patch('/SASjsApi/drive/file', formData)

      axiosPromise
        .then(() => {
          if (filePath && fileContent === prevFileContent) {
            // when fileContent and prevFileContent is same,
            // callback function in setPrevFileContent method is not called
            // because behind the scene useEffect hook is being used
            // for calling callback function, and it's only fired when the
            // new value is not equal to old value.
            // So, we'll have to explicitly update the selected file path

            setSelectedFilePath(filePath, true)
          } else {
            setPrevFileContent(fileContent, () => {
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
      run: () => {
        if (!selectedFilePath) return setOpenFilePathInputModal(true)
        if (prevFileContent !== fileContent) return saveFile()
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
      runCodeAction?.dispose()
    }
  }, [fileContent, prevFileContent, selectedFilePath, saveFile, runCode])

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
        .get(`/SASjsApi/drive/file?_filePath=${selectedFilePath}`)
        .then((res: any) => {
          const content =
            typeof res.data === 'object' ? JSON.stringify(res.data) : res.data
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
