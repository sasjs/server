import { Dispatch, SetStateAction } from 'react'

import {
  Backdrop,
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Tab,
  Tooltip,
  Typography
} from '@mui/material'
import { Menu, MenuOpen } from '@mui/icons-material'
import { styled } from '@mui/material/styles'

import Editor, { MonacoDiffEditor } from 'react-monaco-editor'
import { TabContext, TabList, TabPanel } from '@mui/lab'

import FilePathInputModal from '../../components/filePathInputModal'
import FileMenu from './internal/components/fileMenu'
import RunMenu from './internal/components/runMenu'
import { defineEditorThemes, editorThemeFor } from './internal/editorTheme'
import LintIssues from './internal/components/lint/lintIssues'
import LogComponent from './internal/components/log/logComponent'
import LogTabWithIcons from './internal/components/log/logTabWithIcons'
import WebOutPreview from './internal/components/webout/weboutPreview'

import { usePrompt } from '../../utils/hooks'
import { getLanguageFromExtension } from './internal/helper'
import {
  registerSasCompletions,
  registerSasHover,
  registerSasLanguage,
  startSasLanguageService
} from './internal/languages'
import useEditor from './internal/hooks/useEditor'
import { RunTimeType } from '../../context/appContext'
import { isImageFile, LogObject } from '../../utils'
import { useColorMode, useSetting } from '../../utils/hooks'

// Registered at import time, so Monaco knows the language before the first
// editor model is created.
registerSasLanguage()
registerSasCompletions()
registerSasHover()

// The language server starts once for the app: it serves every editor, so
// the lifecycle belongs here rather than to any single editor mount. A
// failed start leaves the editor on its static providers; the service
// clears its cached rejection, so a later mount retries the start.
startSasLanguageService().catch(() => undefined)

const StyledTabPanel = styled(TabPanel)(() => ({
  padding: '10px'
}))

const StyledTab = styled(Tab)(({ theme }) => ({
  fontSize: '1rem',
  color: theme.palette.text.secondary,
  '&.Mui-selected': {
    color: theme.palette.text.primary
  }
}))

type SASjsEditorProps = {
  selectedFilePath: string
  setSelectedFilePath: (filePath: string, refreshSideBar?: boolean) => void
  tab: string
  setTab: Dispatch<SetStateAction<string>>
  /** Whether the drive explorer is hidden, for the toggle's icon and label. */
  sideBarCollapsed: boolean
  onToggleSideBar: () => void
}

// Before the first editor mounts, and once: both schemes are defined here, and
// the editor names the one matching the app's colour mode.
defineEditorThemes()

const SASjsEditor = ({
  selectedFilePath,
  setSelectedFilePath,
  tab,
  setTab,
  sideBarCollapsed,
  onToggleSideBar
}: SASjsEditorProps) => {
  const [colorMode] = useColorMode()

  const {
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
    setShowDiff,
    setOpenFilePathInputModal,
    setFileContent,
    Snackbar
  } = useEditor({ selectedFilePath, setSelectedFilePath, setTab })

  usePrompt(
    'Changes you made may not be saved.',
    prevFileContent !== fileContent && !!selectedFilePath
  )

  // The dot on the save icon is the same news the unsaved-changes prompt
  // guards: the buffer holds edits the drive does not.
  const isDirty = prevFileContent !== fileContent

  const fileMenu = (
    <FileMenu
      showDiff={showDiff}
      setShowDiff={setShowDiff}
      isDirty={isDirty}
      selectedFilePath={selectedFilePath}
      setOpenFilePathInputModal={setOpenFilePathInputModal}
      saveFile={saveBuffer}
    />
  )

  const monacoEditor = showDiff ? (
    <MonacoDiffEditor
      height="98%"
      // The four marker underlines are a theme colour, so the theme is named
      // rather than left to the wrapper's default: `react-monaco-editor` runs
      // `monaco.editor.setTheme(theme)` in an effect on mount, and its `theme`
      // prop defaults to null, so a theme defined ahead of the editor is
      // replaced with the default as soon as the editor mounts.
      theme={editorThemeFor(colorMode)}
      language={getLanguageFromExtension(selectedFileExtension)}
      original={prevFileContent}
      value={fileContent}
      editorDidMount={handleDiffEditorDidMount}
      onChange={(val) => setFileContent(val)}
    />
  ) : (
    <Editor
      height="98%"
      theme={editorThemeFor(colorMode)}
      language={getLanguageFromExtension(selectedFileExtension)}
      value={fileContent}
      editorDidMount={handleEditorDidMount}
      onChange={(val) => setFileContent(val)}
    />
  )

  // INFO: variable indicating if selected run type is SAS if there are any errors or warnings in the log
  const logWithErrorsOrWarnings =
    selectedRunTime === RunTimeType.SAS && log && typeof log === 'object'

  // The notable notes are listed by default and can be turned off. The Settings
  // panel writes the same key, so the value comes from the store rather than from
  // component state: either control moves both.
  const [notesListed, setNotesListed] = useSetting('log.notableNotes')

  const toggleNotes = () => setNotesListed(!notesListed)

  // A picture is a picture: the file menu is hidden for one, because its save
  // writes the editor's buffer back to the drive and the buffer of an image is
  // empty - saving would truncate the file.
  const isImage = isImageFile(selectedFilePath)

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
          {!isImage && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              {fileMenu}
            </Box>
          )}
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
            {isImage ? (
              imageUrl ? (
                <Box
                  component="img"
                  src={imageUrl}
                  alt={selectedFilePath.split('/').pop() ?? 'image'}
                  sx={{
                    display: 'block',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    margin: '0 auto'
                  }}
                />
              ) : null
            ) : (
              monacoEditor
            )}
          </Paper>
        </Box>
      ) : (
        <TabContext value={tab}>
          <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
              <Tooltip
                title={
                  sideBarCollapsed
                    ? 'Show the drive explorer'
                    : 'Hide the drive explorer'
                }
              >
                <IconButton
                  size="small"
                  onClick={onToggleSideBar}
                  aria-label={
                    sideBarCollapsed
                      ? 'Show the drive explorer'
                      : 'Hide the drive explorer'
                  }
                >
                  {sideBarCollapsed ? <MenuOpen /> : <Menu />}
                </IconButton>
              </Tooltip>
              <TabList onChange={handleTabChange} centered sx={{ flexGrow: 1 }}>
                <StyledTab label="Code" value="code" />
                {log && (
                  <StyledTab
                    label={logWithErrorsOrWarnings ? '' : 'log'}
                    value="log"
                    icon={
                      logWithErrorsOrWarnings ? (
                        <LogTabWithIcons
                          log={log as LogObject}
                          notesListed={notesListed}
                          onToggleNotes={toggleNotes}
                        />
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
          </Box>

          <StyledTabPanel sx={{ paddingBottom: 0 }} value="code">
            {/* One column that fills the viewport: the menu row and the lint
                panel take what they need, and the editor takes the rest. With a
                fixed height on the paper, a lint panel would push the page into
                a scroll of its own. */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 170px)'
              }}
            >
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
              <LintIssues markers={lintMarkers} onSelectLine={revealLine} />
              <Paper
                sx={{
                  flexGrow: 1,
                  minHeight: 0,
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
            </Box>
          </StyledTabPanel>
          <StyledTabPanel value="log">
            {log && (
              <LogComponent
                log={log}
                selectedRunTime={selectedRunTime}
                notesListed={notesListed}
              />
            )}
          </StyledTabPanel>
          {webout && (
            <StyledTabPanel value="webout">
              <WebOutPreview output={webout} />
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
