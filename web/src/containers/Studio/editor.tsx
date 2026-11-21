import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import {
  Backdrop,
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Tab,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material'
import { Menu, MenuOpen } from '@mui/icons-material'
import { styled } from '@mui/material/styles'

import Editor, { monaco } from 'react-monaco-editor'
import lintSchema from '@sasjs/lint/sasjslint-schema.json'
import { TabContext, TabList, TabPanel } from '@mui/lab'

import FilePathInputModal from '../../components/filePathInputModal'
import FolderView from '../../components/folderView'
import { DisplayPane } from './internal/components/displayPane'
import { ChangeReview } from './internal/components/changeReview'
import { comparisonFor, formatKindFor } from './internal/changes'
import {
  DisplayMode,
  displayModeLabel,
  displayModeStorageKey,
  displayModesFor,
  storedDisplayMode
} from './internal/displayMode'
import type { TreeNode } from '../../utils/types'
import FileMenu from './internal/components/fileMenu'
import RunMenu from './internal/components/runMenu'
import { defineEditorThemes, editorThemeFor } from './internal/editorTheme'
import LintIssues from './internal/components/lint/lintIssues'
import LogComponent from './internal/components/log/logComponent'
import LogTabWithIcons from './internal/components/log/logTabWithIcons'
import WebOutPreview from './internal/components/webout/weboutPreview'

import { usePrompt } from '../../utils/hooks'
import { languageForFile } from './internal/helper'
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

// Register the version paired with the server's linter. Monaco's schema
// request service is disabled by default: turning it on globally would let a
// drive file make the browser fetch arbitrary URLs (including same-origin
// endpoints). An inline schema works offline and does not grant that capability.
//
// Registered under the schema's own `$id`, which validation matches against the
// `$schema` a document carries - and documents carry `lintSchemaUrl`. Those are
// the same string in this release, and a spec asserts it, so a release that
// changes one and not the other fails a test instead of silently disabling
// validation. The constant itself is not imported here on purpose: `@sasjs/lint`
// is a Node package, and importing anything from its entry point pulls `fs`,
// `os` and `stream` into the browser bundle, which webpack refuses to resolve.
// The schema JSON is the only part of the package the Studio can use.
const jsonDefaults = monaco.languages.json.jsonDefaults
jsonDefaults.setDiagnosticsOptions({
  ...jsonDefaults.diagnosticsOptions,
  schemas: [
    ...(jsonDefaults.diagnosticsOptions.schemas ?? []),
    { uri: lintSchema.$id, schema: lintSchema }
  ]
})

/**
 * Starts the language server once the editor is on screen and the browser is
 * idle.
 *
 * It used to start at import time, which meant the worker - a payload of
 * several megabytes - began downloading while the Monaco chunk was still on its
 * way, and the two spent the connection on each other: LCP was 5.13s against
 * 1.5s for the same application's other screens. What the server adds is hover,
 * completion and diagnostics, none of which is needed for the first paint, so
 * it waits for one. The static providers registered above mean the editor is
 * fully usable meanwhile, and a start that never happens because the user
 * navigated away costs nothing.
 */
const startLanguageServerWhenIdle = (): (() => void) => {
  let cancelled = false

  const start = () => {
    if (!cancelled) startSasLanguageService().catch(() => undefined)
  }

  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(start, { timeout: 2500 })

    return () => {
      cancelled = true
      window.cancelIdleCallback(handle)
    }
  }

  const handle = window.setTimeout(start, 1500)

  return () => {
    cancelled = true
    window.clearTimeout(handle)
  }
}

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
  /** The folder the URL names, when it names a folder instead of a file. */
  selectedFolderPath?: string
  /** The level the tree holds for that folder, or null until it has been read. */
  folderNode?: TreeNode | null
  /** Goes to a folder - a crumb, or a folder in the listing. */
  openFolder?: (folderPath: string) => void
  /** Searches that folder's files, bodies and all, from the header's box. */
  searchFolder?: (folderPath: string) => void
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
  selectedFolderPath,
  folderNode,
  openFolder,
  searchFolder,
  setSelectedFilePath,
  tab,
  setTab,
  sideBarCollapsed,
  onToggleSideBar
}: SASjsEditorProps) => {
  const [colorMode] = useColorMode()

  // Deferred rather than started at import: see startLanguageServerWhenIdle.
  useEffect(() => startLanguageServerWhenIdle(), [])

  const {
    fileContent,
    imageUrl,
    lintMarkers,
    relayout,
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
    fixLintIssues,
    formatDocument,
    undoFormat,
    beginRevert,
    cancelRevert,
    confirmRevert,
    formatting,
    review,
    setReview,
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

  /* Which of the file's views is showing: the text, a rendering, or both. Only
     the files with a rendering offer the choice (displayMode.ts), and the choice
     is remembered per file type. */
  const displayModes = displayModesFor(selectedFilePath)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('source')

  useEffect(() => {
    setDisplayMode(
      storedDisplayMode(selectedFilePath, { width: window.innerWidth })
    )
  }, [selectedFilePath])

  const chooseDisplayMode = (mode: DisplayMode | null) => {
    if (!mode) return

    setDisplayMode(mode)

    try {
      localStorage.setItem(displayModeStorageKey(selectedFilePath), mode)
    } catch {
      // a browser with storage refused keeps the choice for this session only
    }
  }

  // The editor's width changes with the pane, and Monaco only measures when told.
  useEffect(relayout, [displayMode, review, relayout])

  /**
   * Why the format button cannot be used, or undefined when it can.
   *
   * Three different reasons were collapsed into one tooltip before, which told a
   * `.py` file it had nothing to format: it will never have anything to format.
   */
  const formatDisabledReason = formatting
    ? 'Formatting...'
    : !fileContent.trim()
      ? 'Nothing to format yet'
      : isImageFile(selectedFilePath)
        ? 'A picture cannot be formatted'
        : !formatKindFor({
              path: selectedFilePath,
              runtime: selectedRunTime,
              mode: 'format'
            })
          ? 'Formatting applies to SAS programs and JSON files'
          : undefined

  /**
   * Why the lint-fix button cannot be used, or undefined when it can.
   *
   * The rules are SAS rules, so the button follows the same question the lint
   * flow asks - `lintAppliesTo` - rather than a second copy of it: a `.sas` file
   * qualifies, and an untitled buffer qualifies when the SAS run time is
   * selected. JSON has no lint rules to fix, so it is not included here the way
   * it is in `format`.
   */
  const lintFixDisabledReason = formatting
    ? 'Fixing...'
    : !fileContent.trim()
      ? 'Nothing to fix yet'
      : isImageFile(selectedFilePath)
        ? 'A picture cannot be fixed'
        : !formatKindFor({
              path: selectedFilePath,
              runtime: selectedRunTime,
              mode: 'fix'
            })
          ? 'Lint fixes apply to SAS programs'
          : undefined

  const fileMenu = (
    <FileMenu
      isDirty={isDirty}
      selectedFilePath={selectedFilePath}
      setOpenFilePathInputModal={setOpenFilePathInputModal}
      saveFile={saveBuffer}
      showChanges={() => setReview({ kind: 'saved', before: prevFileContent })}
      fixLintIssues={fixLintIssues}
      formatDocument={formatDocument}
      lintFixDisabledReason={lintFixDisabledReason}
      formatDisabledReason={formatDisabledReason}
    />
  )

  const monacoEditor = (
    <Editor
      height="98%"
      // The four marker underlines are a theme colour, so the theme is named
      // rather than left to the wrapper's default: `react-monaco-editor` runs
      // `monaco.editor.setTheme(theme)` in an effect on mount, and its `theme`
      // prop defaults to null, so a theme defined ahead of the editor is
      // replaced with the default as soon as the editor mounts.
      theme={editorThemeFor(colorMode)}
      language={languageForFile(selectedFilePath, selectedFileExtension)}
      value={fileContent}
      // Monaco measures its container once and only when told. `relayout` below
      // covers the mode switch, but it runs before the split has finished
      // flexing: the editor measured 594px in a 501px column, so it drew over
      // the tree beside it. Reporting the real size is the one fix that cannot
      // be early - the observer fires when the layout is final, for the mode
      // switch, the drive explorer and a window resize alike.
      options={{ automaticLayout: true }}
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

  const displayToggle = displayModes.length > 0 && (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={displayMode}
      onChange={(_event, mode: DisplayMode | null) => chooseDisplayMode(mode)}
      aria-label="Display mode"
    >
      {displayModes.map((mode) => (
        <ToggleButton
          key={mode}
          value={mode}
          sx={{ textTransform: 'none', px: 1.5, py: 0.25 }}
        >
          {displayModeLabel(mode, selectedFilePath)}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )

  /**
   * The editor, and the rendered view beside it or instead of it.
   *
   * One element used by both layouts: a `.md`, `.csv` or `.json` file is not
   * runnable, so it renders in the simpler branch, and the pair has to behave the
   * same there. Monaco stays mounted in the rendered mode - hidden rather than
   * unmounted - so the buffer, its undo history and the cursor survive a look at
   * the preview.
   */
  const codeAndPreview = (
    <Box sx={{ display: 'flex', gap: 1, height: '100%', minHeight: 0 }}>
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          height: '100%',
          display: review || displayMode === 'rendered' ? 'none' : 'block'
        }}
      >
        {monacoEditor}
      </Box>
      {review && (
        <Box sx={{ flex: 1, minWidth: 0, height: '100%' }}>
          <ChangeReview
            {...comparisonFor(review, fileContent)}
            language={languageForFile(selectedFilePath, selectedFileExtension)}
            label={
              review.kind === 'saved'
                ? 'Last loaded or saved → current buffer'
                : 'Before formatting → formatted result'
            }
            untitled={!selectedFilePath}
            onRevert={
              review.kind === 'saved'
                ? {
                    begin: beginRevert,
                    cancel: cancelRevert,
                    confirm: () => {
                      if (confirmRevert() && displayMode === 'rendered')
                        setDisplayMode('source')
                    }
                  }
                : undefined
            }
            onUndoFormatting={
              review.kind === 'format'
                ? () => {
                    if (undoFormat() && displayMode === 'rendered')
                      setDisplayMode('source')
                  }
                : undefined
            }
            onClose={() => {
              setReview(null)
              if (displayMode === 'rendered') setDisplayMode('source')
            }}
          />
        </Box>
      )}
      {!review && displayMode !== 'source' && (
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            height: '100%',
            overflow: 'auto',
            borderLeft: displayMode === 'split' ? 1 : 0,
            borderColor: 'divider'
          }}
        >
          <DisplayPane filePath={selectedFilePath} text={fileContent} />
        </Box>
      )}
    </Box>
  )

  return (
    <Box sx={{ width: '100%', typography: 'body1', marginTop: '50px' }}>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      {selectedFolderPath && !selectedFilePath ? (
        <FolderView
          path={selectedFolderPath}
          node={folderNode ?? null}
          onOpenFile={(filePath) => setSelectedFilePath(filePath)}
          onOpenFolder={(folderPath) => openFolder?.(folderPath)}
          onSearchInside={(folderPath) => searchFolder?.(folderPath)}
        />
      ) : selectedFilePath && !runTimes.includes(selectedFileExtension) ? (
        <Box sx={{ marginTop: '10px' }}>
          {!isImage && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 1
              }}
            >
              {displayToggle}
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
              codeAndPreview
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
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <RunMenu
                  fileContent={fileContent}
                  prevFileContent={prevFileContent}
                  selectedFilePath={selectedFilePath}
                  selectedRunTime={selectedRunTime}
                  runTimes={runTimes}
                  handleChangeRunTime={handleChangeRunTime}
                  handleRunBtnClick={handleRunBtnClick}
                />
                {displayToggle}
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
                {codeAndPreview}
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
