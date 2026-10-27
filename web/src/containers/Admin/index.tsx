import React, { useCallback, useEffect, useState } from 'react'

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'

import axios from 'axios'

/**
 * Administration: what the server is running, what it is using, and what it has
 * been logging. Read-only - every value comes from GET /SASjsApi/admin/*, which
 * is mounted behind authenticateAccessToken + verifyAdmin on the API side, so
 * this screen is only offered to an administrator.
 */

interface BuildInfo {
  version: string
  gitHash: string
  buildDate: string | null
}

interface FolderUsage {
  label: string
  path: string
  exists: boolean
  bytes: number
  files: number
  truncated: boolean
  error?: string
}

interface Diagnostics {
  build: BuildInfo
  server: {
    mode: string
    uptimeSeconds: number
    startedAt: string
    pid: number
    nodeVersion: string
    platform: string
    arch: string
    cpuCount: number
    cpuModel: string
    loadAverage: number[]
    runTimes: string[]
    sasjsRoot: string
  }
  memory: {
    rssBytes: number
    heapTotalBytes: number
    heapUsedBytes: number
    externalBytes: number
    systemTotalBytes: number
    systemFreeBytes: number
  }
  filesystem: {
    path: string
    totalBytes: number
    freeBytes: number
    usedBytes: number
    usedPercent: number
  } | null
  folders: FolderUsage[]
  logs: {
    folder: string
    fileCount: number
    totalBytes: number
    newestFile: string | null
    newestModified: string | null
  }
}

interface LogFileInfo {
  name: string
  sizeBytes: number
  modified: string
}

interface LogTail {
  fileName: string
  lines: number
  bytesRead: number
  truncated: boolean
  content: string
}

export const formatBytes = (bytes: number): string => {
  if (!bytes || bytes < 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let value = bytes
  let unit = 0

  while (value >= 1024 && unit < units.length - 1) {
    value = value / 1024
    unit++
  }

  return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`
}

export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds < 0) return '0s'

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = Math.floor(seconds % 60)

  const parts = [
    days ? `${days}d` : '',
    hours ? `${hours}h` : '',
    minutes ? `${minutes}m` : '',
    `${rest}s`
  ].filter(Boolean)

  return parts.slice(-3).join(' ')
}

const formatDate = (value: string | null): string =>
  value ? new Date(value).toLocaleString() : 'unknown'

const StatRow = ({
  label,
  value
}: {
  label: string
  value: React.ReactNode
}) => (
  <TableRow>
    <TableCell sx={{ border: 'none', py: 0.5, pl: 0 }}>{label}</TableCell>
    <TableCell sx={{ border: 'none', py: 0.5, pr: 0 }} align="right">
      {value}
    </TableCell>
  </TableRow>
)

const Card = ({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) => (
  <Paper sx={{ p: 2, minWidth: 280, flex: '1 1 320px' }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
      {title}
    </Typography>
    {children}
  </Paper>
)

const Admin = () => {
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [logFiles, setLogFiles] = useState<LogFileInfo[]>([])
  const [selectedLog, setSelectedLog] = useState<string>('')
  const [logLines, setLogLines] = useState<number>(200)
  const [logTail, setLogTail] = useState<LogTail | null>(null)
  const [isLogLoading, setIsLogLoading] = useState(false)

  const loadDiagnostics = useCallback(() => {
    setIsLoading(true)
    setError(null)

    axios
      .get('/SASjsApi/admin/diagnostics')
      .then((res) => setDiagnostics(res.data))
      .catch((err) => {
        // The message matters here: 401 is "you are not an admin", and a 403
        // with a body means the request itself was refused.
        setError(
          err?.response?.data?.message ||
            err?.response?.data ||
            err?.message ||
            'Could not load diagnostics.'
        )
      })
      .finally(() => setIsLoading(false))
  }, [])

  const loadLogFiles = useCallback(() => {
    axios
      .get('/SASjsApi/admin/logs')
      .then((res) => {
        const files: LogFileInfo[] = res.data?.files ?? []
        setLogFiles(files)
        setSelectedLog((current) => current || files[0]?.name || '')
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message ||
            err?.response?.data ||
            err?.message ||
            'Could not load the log file list.'
        )
      })
  }, [])

  const loadLogTail = useCallback((fileName: string, lines: number) => {
    if (!fileName) return

    setIsLogLoading(true)

    axios
      .get(`/SASjsApi/admin/logs/${encodeURIComponent(fileName)}`, {
        params: { lines }
      })
      .then((res) => setLogTail(res.data))
      .catch((err) => {
        setLogTail(null)
        setError(
          err?.response?.data?.message ||
            err?.response?.data ||
            err?.message ||
            'Could not read that log file.'
        )
      })
      .finally(() => setIsLogLoading(false))
  }, [])

  useEffect(() => {
    loadDiagnostics()
    loadLogFiles()
  }, [loadDiagnostics, loadLogFiles])

  useEffect(() => {
    if (selectedLog) loadLogTail(selectedLog, logLines)
  }, [selectedLog, logLines, loadLogTail])

  const memoryPercent = diagnostics
    ? Math.round(
        (diagnostics.memory.systemFreeBytes /
          Math.max(diagnostics.memory.systemTotalBytes, 1)) *
          100
      )
    : 0

  return (
    <Box sx={{ p: 2, maxWidth: '1400px' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2
        }}
      >
        <Typography variant="h6">Administration</Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            loadDiagnostics()
            loadLogFiles()
            if (selectedLog) loadLogTail(selectedLog, logLines)
          }}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {String(error)}
        </Alert>
      )}

      {isLoading && !diagnostics && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {diagnostics && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Card title="Release">
            <Table size="small">
              <TableBody>
                <StatRow
                  label="Version"
                  value={
                    <Typography
                      component="span"
                      sx={{ fontFamily: 'monospace' }}
                    >
                      {diagnostics.build.version}
                    </Typography>
                  }
                />
                <StatRow
                  label="Commit"
                  value={
                    <Typography
                      component="span"
                      sx={{ fontFamily: 'monospace' }}
                    >
                      {diagnostics.build.gitHash}
                    </Typography>
                  }
                />
                <StatRow
                  label="Built"
                  value={formatDate(diagnostics.build.buildDate)}
                />
                <StatRow label="Mode" value={diagnostics.server.mode} />
                <StatRow
                  label="Runtimes"
                  value={diagnostics.server.runTimes?.join(', ') || 'none'}
                />
              </TableBody>
            </Table>
          </Card>

          <Card title="Server">
            <Table size="small">
              <TableBody>
                <StatRow
                  label="Uptime"
                  value={formatDuration(diagnostics.server.uptimeSeconds)}
                />
                <StatRow
                  label="Started"
                  value={formatDate(diagnostics.server.startedAt)}
                />
                <StatRow label="PID" value={diagnostics.server.pid} />
                <StatRow label="Node" value={diagnostics.server.nodeVersion} />
                <StatRow
                  label="Platform"
                  value={`${diagnostics.server.platform} ${diagnostics.server.arch}`}
                />
                <StatRow
                  label="Load (1/5/15m)"
                  value={diagnostics.server.loadAverage.join(' / ')}
                />
                <StatRow
                  label="CPUs"
                  value={diagnostics.server.cpuCount}
                  // model is long; the count is what matters at a glance
                />
              </TableBody>
            </Table>
          </Card>

          <Card title="Memory">
            <Table size="small">
              <TableBody>
                <StatRow
                  label="Process RSS"
                  value={formatBytes(diagnostics.memory.rssBytes)}
                />
                <StatRow
                  label="Heap used"
                  value={`${formatBytes(
                    diagnostics.memory.heapUsedBytes
                  )} / ${formatBytes(diagnostics.memory.heapTotalBytes)}`}
                />
                <StatRow
                  label="System free"
                  value={`${formatBytes(
                    diagnostics.memory.systemFreeBytes
                  )} of ${formatBytes(diagnostics.memory.systemTotalBytes)}`}
                />
                <StatRow
                  label="System used"
                  value={`${100 - memoryPercent}%`}
                />
              </TableBody>
            </Table>
          </Card>

          <Card title="Disk">
            {diagnostics.filesystem ? (
              <Table size="small">
                <TableBody>
                  <StatRow
                    label="Filesystem"
                    value={diagnostics.filesystem.path}
                  />
                  <StatRow
                    label="Used"
                    value={`${formatBytes(
                      diagnostics.filesystem.usedBytes
                    )} of ${formatBytes(diagnostics.filesystem.totalBytes)}`}
                  />
                  <StatRow
                    label="Free"
                    value={formatBytes(diagnostics.filesystem.freeBytes)}
                  />
                  <StatRow
                    label="Utilisation"
                    value={`${diagnostics.filesystem.usedPercent}%`}
                  />
                </TableBody>
              </Table>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Filesystem usage is unavailable on this platform.
              </Typography>
            )}
          </Card>
        </Box>
      )}

      {diagnostics && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Folders under SASJS_ROOT
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {diagnostics.server.sasjsRoot || 'not configured'}
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Folder</TableCell>
                <TableCell align="right">Size</TableCell>
                <TableCell align="right">Files</TableCell>
                <TableCell>Path</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {diagnostics.folders.map((folder) => (
                <TableRow key={folder.label}>
                  <TableCell>{folder.label}</TableCell>
                  <TableCell align="right">
                    {folder.exists ? formatBytes(folder.bytes) : '-'}
                    {folder.truncated ? '+' : ''}
                  </TableCell>
                  <TableCell align="right">
                    {folder.exists ? folder.files : '-'}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {folder.error ? `(${folder.error})` : folder.path}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Paper sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
            mb: 1
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Logs
          </Typography>
          {diagnostics && (
            <Typography variant="body2" color="text.secondary">
              {diagnostics.logs.fileCount} files,{' '}
              {formatBytes(diagnostics.logs.totalBytes)}
            </Typography>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <Select
              value={selectedLog}
              displayEmpty
              onChange={(event) => setSelectedLog(event.target.value as string)}
            >
              {logFiles.length === 0 && (
                <MenuItem value="" disabled>
                  No log files
                </MenuItem>
              )}
              {logFiles.map((file) => (
                <MenuItem key={file.name} value={file.name}>
                  {file.name} ({formatBytes(file.sizeBytes)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            type="number"
            label="Lines"
            value={logLines}
            onChange={(event) =>
              setLogLines(
                Math.min(Math.max(Number(event.target.value), 1), 5000)
              )
            }
            sx={{ width: 110 }}
          />
          <Button
            variant="outlined"
            size="small"
            disabled={!selectedLog || isLogLoading}
            onClick={() => loadLogTail(selectedLog, logLines)}
          >
            Load
          </Button>
        </Box>

        <Divider sx={{ mb: 1 }} />

        {logTail ? (
          <>
            <Typography variant="caption" color="text.secondary">
              {logTail.fileName}: last {logTail.lines} lines
              {logTail.truncated ? ' (earlier lines not shown)' : ''}
            </Typography>
            <Box
              component="pre"
              sx={{
                m: 0,
                mt: 1,
                p: 1,
                maxHeight: '45vh',
                overflow: 'auto',
                background: '#111',
                color: '#e0e0e0',
                fontSize: 12,
                borderRadius: 1
              }}
            >
              {logTail.content}
            </Box>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {isLogLoading ? 'Loading...' : 'No log lines loaded.'}
          </Typography>
        )}
      </Paper>
    </Box>
  )
}

export default Admin
