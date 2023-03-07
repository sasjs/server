import {
  Box,
  Button,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tooltip
} from '@mui/material'

import { RocketLaunch } from '@mui/icons-material'

type RunMenuProps = {
  selectedFilePath: string
  fileContent: string
  prevFileContent: string
  selectedRunTime: string
  runTimes: string[]
  handleChangeRunTime: (event: SelectChangeEvent) => void
  handleRunBtnClick: () => void
}

const RunMenu = ({
  selectedFilePath,
  fileContent,
  prevFileContent,
  selectedRunTime,
  runTimes,
  handleChangeRunTime,
  handleRunBtnClick
}: RunMenuProps) => {
  const launchProgram = () => {
    const baseUrl = window.location.origin + window.location.pathname
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
          <Tooltip
            title={
              fileContent !== prevFileContent
                ? 'Save file before launching program'
                : 'Launch program in new window'
            }
          >
            <span>
              <IconButton
                disabled={fileContent !== prevFileContent}
                onClick={launchProgram}
              >
                <RocketLaunch />
              </IconButton>
            </span>
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

export default RunMenu
