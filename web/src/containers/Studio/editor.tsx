import { Dispatch, SetStateAction } from 'react'

import {
  Backdrop,
  Box,
  CircularProgress,
  Paper,
  Tab,
  Tooltip,
  Typography
} from '@mui/material'
import { styled } from '@mui/material/styles'

import Editor, { MonacoDiffEditor } from 'react-monaco-editor'
import { TabContext, TabList, TabPanel } from '@mui/lab'

import FilePathInputModal from '../../components/filePathInputModal'
import FileMenu from './internal/components/fileMenu'
import RunMenu from './internal/components/runMenu'
import LogComponent from './internal/components/log/logComponent'
import LogTabWithIcons from './internal/components/log/logTabWithIcons'

import { usePrompt } from '../../utils/hooks'
import { getLanguageFromExtension } from './internal/helper'
import useEditor from './internal/hooks/useEditor'
import { RunTimeType } from '../../context/appContext'
import { LogObject } from '../../utils'

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
  tab: string
  setTab: Dispatch<SetStateAction<string>>
}

const SASjsEditor = ({
  selectedFilePath,
  setSelectedFilePath,
  tab,
  setTab
}: SASjsEditorProps) => {
  const {
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
  } = useEditor({ selectedFilePath, setSelectedFilePath, setTab })

  usePrompt(
    'Changes you made may not be saved.',
    prevFileContent !== fileContent && !!selectedFilePath
  )

  const fileMenu = (
    <FileMenu
      showDiff={showDiff}
      setShowDiff={setShowDiff}
      prevFileContent={prevFileContent}
      currentFileContent={fileContent}
      selectedFilePath={selectedFilePath}
      setOpenFilePathInputModal={setOpenFilePathInputModal}
      saveFile={saveFile}
    />
  )

  const monacoEditor = showDiff ? (
    <MonacoDiffEditor
      height="98%"
      language={getLanguageFromExtension(selectedFileExtension)}
      original={prevFileContent}
      value={fileContent}
      editorDidMount={handleDiffEditorDidMount}
      onChange={(val) => setFileContent(val)}
    />
  ) : (
    <Editor
      height="98%"
      language={getLanguageFromExtension(selectedFileExtension)}
      value={fileContent}
      editorDidMount={handleEditorDidMount}
      onChange={(val) => setFileContent(val)}
    />
  )

  // INFO: variable indicating if selected run type is SAS if there are any errors or warnings in the log
  const logWithErrorsOrWarnings =
    selectedRunTime === RunTimeType.SAS && log && typeof log === 'object'

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
            {fileMenu}
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
            {monacoEditor}
          </Paper>
        </Box>
      ) : (
        <TabContext value={tab}>
          <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              background: 'white'
            }}
          >
            <TabList onChange={handleTabChange} centered>
              <StyledTab label="Code" value="code" />
              {log && (
                <StyledTab
                  label={logWithErrorsOrWarnings ? '' : 'log'}
                  value="log"
                  icon={
                    logWithErrorsOrWarnings ? (
                      <LogTabWithIcons log={log as LogObject} />
                    ) : (
                      ''
                    )
                  }
                  onClick={() => {
                    const logWrapper = document.querySelector(`#logWrapper`)

                    if (logWrapper) logWrapper.scrollTop = 0
                  }}
                />
              )}
              {webout && (
                <StyledTab
                  label={
                    <Tooltip title="Displays content from the _webout fileref">
                      <Typography>Webout</Typography>
                    </Tooltip>
                  }
                  value="webout"
                />
              )}
              {printOutput && <StyledTab label="print" value="printOutput" />}
            </TabList>
          </Box>

          <StyledTabPanel sx={{ paddingBottom: 0 }} value="code">
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <RunMenu
                fileContent={fileContent}
                prevFileContent={prevFileContent}
                selectedFilePath={selectedFilePath}
                selectedRunTime={selectedRunTime}
                runTimes={runTimes}
                handleChangeRunTime={handleChangeRunTime}
                handleRunBtnClick={handleRunBtnClick}
              />
              {fileMenu}
            </Box>
            <Paper
              sx={{
                height: 'calc(100vh - 170px)',
                padding: '10px',
                overflow: 'auto',
                position: 'relative'
              }}
              elevation={3}
            >
              {monacoEditor}
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
          <StyledTabPanel value="log">
            {log && (
              <LogComponent log={log} selectedRunTime={selectedRunTime} />
            )}
          </StyledTabPanel>
          {webout && (
            <StyledTabPanel value="webout">
              <div>
                <pre>{webout}</pre>
              </div>
            </StyledTabPanel>
          )}
          {printOutput && (
            <StyledTabPanel value="printOutput">
              <div>
                <pre>{printOutput}</pre>
              </div>
            </StyledTabPanel>
          )}
        </TabContext>
      )}
      <Dialog />
      <Snackbar />
      <FilePathInputModal
        open={openFilePathInputModal}
        setOpen={setOpenFilePathInputModal}
        saveFile={handleFilePathInput}
      />
    </Box>
  )
}

export default SASjsEditor
