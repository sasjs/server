import React, { useEffect, useRef, useState, useContext } from 'react'
import axios from 'axios'

import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Tab,
  Tooltip
} from '@mui/material'
import { styled } from '@mui/material/styles'

import {
  RocketLaunch,
  MoreVert,
  Save,
  SaveAs,
  Difference,
  Edit
} from '@mui/icons-material'
import Editor, {
  MonacoDiffEditor,
  DiffEditorDidMount,
  EditorDidMount
} from 'react-monaco-editor'
import { TabContext, TabList, TabPanel } from '@mui/lab'

import { AppContext, RunTimeType } from '../../context/appContext'

import FilePathInputModal from '../../components/filePathInputModal'
import BootstrapSnackbar, { AlertSeverityType } from '../../components/snackbar'
import Modal from '../../components/modal'

import { usePrompt, useStateWithCallback } from '../../utils/hooks'

const StyledTabPanel = styled(TabPanel)(() => ({
  padding: '10px'
}))

const StyledTab = styled(Tab)(() => ({
  fontSize: '1rem',
  color: 'gray',
  '&.Mui-selected': {
    color: 'black'
  }
}))

type SASjsEditorProps = {
  selectedFilePath: string
  setSelectedFilePath: (filePath: string, refreshSideBar?: boolean) => void
}

const baseUrl = window.location.origin

const SASjsEditor = ({
  selectedFilePath,
  setSelectedFilePath
}: SASjsEditorProps) => {
  const appContext = useContext(AppContext)
  const [isLoading, setIsLoading] = useState(false)
  const [openModal, setOpenModal] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalPayload, setModalPayload] = useState('')
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertSeverityType>(
    AlertSeverityType.Success
  )
  const [prevFileContent, setPrevFileContent] = useStateWithCallback('')
  const [fileContent, setFileContent] = useState('')
  const [log, setLog] = useState('')
  const [ctrlPressed, setCtrlPressed] = useState(false)
  const [webout, setWebout] = useState('')
  const [tab, setTab] = useState('1')
  const [runTimes, setRunTimes] = useState<string[]>([])
  const [selectedRunTime, setSelectedRunTime] = useState('')
  const [selectedFileExtension, setSelectedFileExtension] = useState('')
  const [openFilePathInputModal, setOpenFilePathInputModal] = useState(false)
  const [showDiff, setShowDiff] = useState(false)

  const editorRef = useRef(null as any)

  const diffEditorRef = useRef(null as any)

  const handleEditorDidMount: EditorDidMount = (editor) => {
    editor.focus()
    editorRef.current = editor
  }

  const handleDiffEditorDidMount: DiffEditorDidMount = (diffEditor) => {
    diffEditor.focus()
    diffEditorRef.current = diffEditor
  }

  usePrompt(
    'Changes you made may not be saved.',
    prevFileContent !== fileContent && !!selectedFilePath
  )

  useEffect(() => {
    setRunTimes(Object.values(appContext.runTimes))
  }, [appContext.runTimes])

  useEffect(() => {
    if (runTimes.length) setSelectedRunTime(runTimes[0])
  }, [runTimes])

  useEffect(() => {
    if (selectedFilePath) {
      setIsLoading(true)
      setSelectedFileExtension(selectedFilePath.split('.').pop() ?? '')
      axios
        .get(`/SASjsApi/drive/file?_filePath=${selectedFilePath}`)
        .then((res: any) => {
          setPrevFileContent(res.data)
          setFileContent(res.data)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilePath])

  useEffect(() => {
    if (fileContent.length && !selectedFilePath) {
      localStorage.setItem('fileContent', fileContent)
    }
  }, [fileContent, selectedFilePath])

  useEffect(() => {
    if (runTimes.includes(selectedFileExtension))
      setSelectedRunTime(selectedFileExtension)
  }, [selectedFileExtension, runTimes])

  const handleTabChange = (_e: any, newValue: string) => {
    setTab(newValue)
  }

  const getSelection = () => {
    const editor = editorRef.current as any
    const selection = editor?.getModel().getValueInRange(editor?.getSelection())
    return selection ?? ''
  }

  const handleRunBtnClick = () => runCode(getSelection() || fileContent)

  const runCode = (code: string) => {
    setIsLoading(true)
    axios
      .post(`/SASjsApi/code/execute`, { code, runTime: selectedRunTime })
      .then((res: any) => {
        const parsedLog = res?.data?.log
          .map((logLine: any) => logLine.line)
          .join('\n')

        setLog(parsedLog)

        setWebout(`${res.data?._webout}`)
        setTab('2')

        // Scroll to bottom of log
        window.scrollTo(0, document.body.scrollHeight)
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
  }

  const handleKeyDown = (event: any) => {
    if (event.ctrlKey) {
      if (event.key === 'v') {
        setCtrlPressed(false)
      }

      if (event.key === 'Enter') runCode(getSelection() || fileContent)
      if (!ctrlPressed) setCtrlPressed(true)
    }
  }

  const handleKeyUp = (event: any) => {
    if (!event.ctrlKey && ctrlPressed) setCtrlPressed(false)
  }

  const handleChangeRunTime = (event: SelectChangeEvent) => {
    setSelectedRunTime(event.target.value as RunTimeType)
  }

  const handleFilePathInput = (filePath: string) => {
    setOpenFilePathInputModal(false)
    saveFile(filePath)
  }

  const saveFile = (filePath?: string) => {
    setIsLoading(true)

    const formData = new FormData()

    const stringBlob = new Blob([fileContent], { type: 'text/plain' })
    formData.append('file', stringBlob, 'filename.sas')
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
  }

  return (
    <Box sx={{ width: '100%', typography: 'body1', marginTop: '50px' }}>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      {selectedFilePath && !runTimes.includes(selectedFileExtension) ? (
        <Box sx={{ marginTop: '10px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <FileMenu
              showDiff={showDiff}
              setShowDiff={setShowDiff}
              prevFileContent={prevFileContent}
              currentFileContent={fileContent}
              selectedFilePath={selectedFilePath}
              setOpenFilePathInputModal={setOpenFilePathInputModal}
              saveFile={saveFile}
            />
          </Box>
          <Paper
            sx={{
              height: 'calc(100vh - 140px)',
              padding: '10px',
              margin: '0 24px',
              overflow: 'auto',
              position: 'relative'
            }}
            elevation={3}
          >
            {showDiff ? (
              <MonacoDiffEditor
                height="98%"
                language={getLanguage(selectedFileExtension)}
                original={prevFileContent}
                value={fileContent}
                editorDidMount={handleDiffEditorDidMount}
                options={{ readOnly: ctrlPressed }}
                onChange={(val) => setFileContent(val)}
              />
            ) : (
              <Editor
                height="98%"
                language={getLanguage(selectedFileExtension)}
                value={fileContent}
                editorDidMount={handleEditorDidMount}
                options={{ readOnly: ctrlPressed }}
                onChange={(val) => setFileContent(val)}
              />
            )}
          </Paper>
        </Box>
      ) : (
        <TabContext value={tab}>
          <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              position: 'fixed',
              background: 'white',
              width: '85%'
            }}
          >
            <TabList onChange={handleTabChange} centered>
              <StyledTab label="Code" value="1" />
              <StyledTab label="Log" value="2" />
              <Tooltip title="Displays content from the _webout fileref">
                <StyledTab label="Webout" value="3" />
              </Tooltip>
            </TabList>
          </Box>

          <StyledTabPanel
            sx={{ paddingBottom: 0, marginTop: '45px' }}
            value="1"
          >
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <RunMenu
                selectedFilePath={selectedFilePath}
                selectedRunTime={selectedRunTime}
                runTimes={runTimes}
                handleChangeRunTime={handleChangeRunTime}
                handleRunBtnClick={handleRunBtnClick}
              />
              <FileMenu
                showDiff={showDiff}
                setShowDiff={setShowDiff}
                prevFileContent={prevFileContent}
                currentFileContent={fileContent}
                selectedFilePath={selectedFilePath}
                setOpenFilePathInputModal={setOpenFilePathInputModal}
                saveFile={saveFile}
              />
            </Box>
            <Paper
              onKeyUp={handleKeyUp}
              onKeyDown={handleKeyDown}
              sx={{
                height: 'calc(100vh - 170px)',
                padding: '10px',
                overflow: 'auto',
                position: 'relative'
              }}
              elevation={3}
            >
              {showDiff ? (
                <MonacoDiffEditor
                  height="98%"
                  language={getLanguage(selectedFileExtension)}
                  original={prevFileContent}
                  value={fileContent}
                  editorDidMount={handleDiffEditorDidMount}
                  options={{ readOnly: ctrlPressed }}
                  onChange={(val) => setFileContent(val)}
                />
              ) : (
                <Editor
                  height="98%"
                  language={getLanguage(selectedFileExtension)}
                  value={fileContent}
                  editorDidMount={handleEditorDidMount}
                  options={{ readOnly: ctrlPressed }}
                  onChange={(val) => setFileContent(val)}
                />
              )}
              <p
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: -10,
                  textAlign: 'center',
                  fontSize: '13px'
                }}
              >
                Press CTRL + ENTER to run code
              </p>
            </Paper>
          </StyledTabPanel>
          <StyledTabPanel value="2">
            <div style={{ marginTop: '50px' }}>
              <h2>SAS Log</h2>
              <pre>{log}</pre>
            </div>
          </StyledTabPanel>
          <StyledTabPanel value="3">
            <div style={{ marginTop: '50px' }}>
              <pre>{webout}</pre>
            </div>
          </StyledTabPanel>
        </TabContext>
      )}
      <Modal
        open={openModal}
        setOpen={setOpenModal}
        title={modalTitle}
        payload={modalPayload}
      />
      <BootstrapSnackbar
        open={openSnackbar}
        setOpen={setOpenSnackbar}
        message={snackbarMessage}
        severity={snackbarSeverity}
      />
      <FilePathInputModal
        open={openFilePathInputModal}
        setOpen={setOpenFilePathInputModal}
        saveFile={handleFilePathInput}
      />
    </Box>
  )
}

export default SASjsEditor

type RunMenuProps = {
  selectedFilePath: string
  selectedRunTime: string
  runTimes: string[]
  handleChangeRunTime: (event: SelectChangeEvent) => void
  handleRunBtnClick: () => void
}

const RunMenu = ({
  selectedFilePath,
  selectedRunTime,
  runTimes,
  handleChangeRunTime,
  handleRunBtnClick
}: RunMenuProps) => {
  const launchProgram = () => {
    window.open(`${baseUrl}/SASjsApi/stp/execute?_program=${selectedFilePath}`)
  }

  return (
    <>
      <Tooltip title="CTRL+ENTER will also run code">
        <Button
          onClick={handleRunBtnClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            padding: '5px 5px',
            minWidth: 'unset'
          }}
        >
          <img
            alt=""
            draggable="false"
            style={{ width: '25px' }}
            src="/running-sas.png"
          ></img>
          <span style={{ fontSize: '12px' }}>RUN</span>
        </Button>
      </Tooltip>
      {selectedFilePath ? (
        <Box sx={{ marginLeft: '10px' }}>
          <Tooltip title="Launch program in new window">
            <IconButton onClick={launchProgram}>
              <RocketLaunch />
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        <Box sx={{ minWidth: '75px', marginLeft: '10px' }}>
          <FormControl variant="standard">
            <Select
              labelId="run-time-select-label"
              id="run-time-select"
              value={selectedRunTime}
              onChange={handleChangeRunTime}
            >
              {runTimes.map((runTime) => (
                <MenuItem key={runTime} value={runTime}>
                  {runTime}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}
    </>
  )
}

type FileMenuProps = {
  showDiff: boolean
  setShowDiff: React.Dispatch<React.SetStateAction<boolean>>
  prevFileContent: string
  currentFileContent: string
  selectedFilePath: string
  setOpenFilePathInputModal: React.Dispatch<React.SetStateAction<boolean>>
  saveFile: () => void
}

const FileMenu = ({
  showDiff,
  setShowDiff,
  prevFileContent,
  currentFileContent,
  selectedFilePath,
  setOpenFilePathInputModal,
  saveFile
}: FileMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<
    (EventTarget & HTMLButtonElement) | null
  >(null)

  const handleMenu = (
    event?: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    if (event) setAnchorEl(event.currentTarget)
    else setAnchorEl(null)
  }

  const handleDiffBtnClick = () => {
    setAnchorEl(null)
    setShowDiff(!showDiff)
  }

  const handleSaveAsBtnClick = () => {
    setAnchorEl(null)
    setOpenFilePathInputModal(true)
  }

  const handleSaveBtnClick = () => {
    setAnchorEl(null)
    saveFile()
  }

  return (
    <>
      <Tooltip title="Save File Menu">
        <IconButton onClick={handleMenu}>
          <MoreVert />
        </IconButton>
      </Tooltip>
      <Menu
        id="save-file-menu"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
        open={!!anchorEl}
        onClose={() => handleMenu()}
      >
        <MenuItem sx={{ justifyContent: 'center' }}>
          <Button
            onClick={handleDiffBtnClick}
            variant="contained"
            color="primary"
            startIcon={showDiff ? <Edit /> : <Difference />}
          >
            {showDiff ? 'Edit' : 'Diff'}
          </Button>
        </MenuItem>
        <MenuItem sx={{ justifyContent: 'center' }}>
          <Button
            onClick={handleSaveBtnClick}
            variant="contained"
            color="primary"
            startIcon={<Save />}
            disabled={
              !selectedFilePath || prevFileContent === currentFileContent
            }
          >
            Save
          </Button>
        </MenuItem>
        <MenuItem sx={{ justifyContent: 'center' }}>
          <Button
            onClick={handleSaveAsBtnClick}
            variant="contained"
            color="primary"
            startIcon={<SaveAs />}
          >
            Save As
          </Button>
        </MenuItem>
      </Menu>
    </>
  )
}

const getLanguage = (extension: string) => {
  if (extension === 'js') return 'javascript'

  if (extension === 'ts') return 'typescript'

  if (extension === 'md' || extension === 'mdx') return 'markdown'

  return extension
}
