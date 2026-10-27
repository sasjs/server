import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  getFilesFolder,
  getLogFolder,
  getSasjsDriveFolder,
  getSasjsRootFolder,
  getSessionsFolder,
  getUploadsFolder,
  getWeboutFolder
} from './file'

/**
 * Read-only measurements for the administration screen: how big the folders
 * under SASJS_ROOT have grown, how much room is left on the filesystem, what
 * the process is using, and which access logs exist.
 *
 * Everything here is best-effort. A folder that cannot be read, a dangling
 * symlink or a missing SASJS_ROOT must degrade one field of the answer rather
 * than fail the request - the same fault that empties the Studio file tree
 * when `buildDirectoryTree()` throws.
 */

// A recursive walk of a large drive could take minutes. The cap keeps the
// answer bounded and reports whether it is complete.
const MAX_ENTRIES = 50000

export interface FolderUsage {
  label: string
  path: string
  exists: boolean
  bytes: number
  files: number
  /** True when the walk stopped at MAX_ENTRIES, so `bytes` is a lower bound. */
  truncated: boolean
  error?: string
}

export interface FilesystemUsage {
  path: string
  totalBytes: number
  freeBytes: number
  usedBytes: number
  usedPercent: number
}

export interface ProcessMetrics {
  pid: number
  uptimeSeconds: number
  startedAt: string
  nodeVersion: string
  platform: string
  arch: string
  cpuCount: number
  cpuModel: string
  loadAverage: number[]
  processMemory: {
    rssBytes: number
    heapTotalBytes: number
    heapUsedBytes: number
    externalBytes: number
  }
  systemMemory: {
    totalBytes: number
    freeBytes: number
  }
}

export interface LogFileInfo {
  name: string
  sizeBytes: number
  modified: string
}

export interface LogFolderSummary {
  folder: string
  fileCount: number
  totalBytes: number
  newestFile: string | null
  newestModified: string | null
}

export interface LogTail {
  fileName: string
  lines: number
  bytesRead: number
  /** True when earlier lines exist but are not included in `content`. */
  truncated: boolean
  content: string
}

const statOrNull = async (filePath: string): Promise<fs.Stats | null> => {
  try {
    return await fs.promises.stat(filePath)
  } catch (error) {
    return null
  }
}

/**
 * Total bytes and file count under a folder, without following symlinks.
 *
 * Symlinks are counted as entries but never traversed: a link pointing at `/`
 * or at its own parent would otherwise walk the whole filesystem or loop.
 */
export const getFolderUsage = async (
  label: string,
  folder: string | undefined
): Promise<FolderUsage> => {
  const result: FolderUsage = {
    label,
    path: folder ?? '',
    exists: false,
    bytes: 0,
    files: 0,
    truncated: false
  }

  if (!folder) return { ...result, error: 'not configured' }

  const stats = await statOrNull(folder)

  if (!stats) return { ...result, error: 'not found' }
  if (!stats.isDirectory())
    return { ...result, exists: true, error: 'not a directory' }

  result.exists = true

  let entries = 0
  const pending: string[] = [folder]

  while (pending.length) {
    const current = pending.pop() as string

    let dirents: fs.Dirent[]

    try {
      dirents = await fs.promises.readdir(current, { withFileTypes: true })
    } catch (error) {
      // Unreadable subfolder: keep what has been counted so far.
      continue
    }

    for (const dirent of dirents) {
      if (entries >= MAX_ENTRIES) {
        result.truncated = true
        return result
      }

      entries++

      const fullPath = path.join(current, dirent.name)

      if (dirent.isSymbolicLink()) continue

      if (dirent.isDirectory()) {
        pending.push(fullPath)
        continue
      }

      if (!dirent.isFile()) continue

      const fileStats = await statOrNull(fullPath)

      if (!fileStats) continue

      result.files++
      result.bytes += fileStats.size
    }
  }

  return result
}

export const getFilesystemUsage = async (
  folder: string | undefined
): Promise<FilesystemUsage | null> => {
  if (!folder) return null

  try {
    // statfs arrived in Node 18.15; older runtimes simply report nothing.
    const stats = await (fs.promises as any).statfs(folder)

    const totalBytes = stats.blocks * stats.bsize
    const freeBytes = stats.bavail * stats.bsize
    const usedBytes = totalBytes - freeBytes

    return {
      path: folder,
      totalBytes,
      freeBytes,
      usedBytes,
      usedPercent:
        totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 1000) / 10 : 0
    }
  } catch (error) {
    return null
  }
}

export const getProcessMetrics = (): ProcessMetrics => {
  const memory = process.memoryUsage()
  const cpus = os.cpus()

  return {
    pid: process.pid,
    uptimeSeconds: Math.round(process.uptime()),
    startedAt: new Date(
      Date.now() - Math.round(process.uptime() * 1000)
    ).toISOString(),
    nodeVersion: process.version,
    platform: `${os.platform()} ${os.release()}`,
    arch: process.arch,
    cpuCount: cpus.length,
    cpuModel: cpus[0]?.model ?? 'unknown',
    loadAverage: os.loadavg().map((value) => Math.round(value * 100) / 100),
    processMemory: {
      rssBytes: memory.rss,
      heapTotalBytes: memory.heapTotal,
      heapUsedBytes: memory.heapUsed,
      externalBytes: memory.external
    },
    systemMemory: {
      totalBytes: os.totalmem(),
      freeBytes: os.freemem()
    }
  }
}

export const listLogFiles = async (): Promise<LogFileInfo[]> => {
  const folder = getLogFolder()

  if (!folder) return []

  let names: string[]

  try {
    names = await fs.promises.readdir(folder)
  } catch (error) {
    return []
  }

  const files: LogFileInfo[] = []

  for (const name of names) {
    if (!name.toLowerCase().endsWith('.log')) continue

    const stats = await statOrNull(path.join(folder, name))

    if (!stats || !stats.isFile()) continue

    files.push({
      name,
      sizeBytes: stats.size,
      modified: stats.mtime.toISOString()
    })
  }

  return files.sort((a, b) => (a.modified < b.modified ? 1 : -1))
}

export const getLogFolderSummary = async (): Promise<LogFolderSummary> => {
  const folder = getLogFolder()
  const files = await listLogFiles()

  return {
    folder: folder ?? '',
    fileCount: files.length,
    totalBytes: files.reduce((total, file) => total + file.sizeBytes, 0),
    newestFile: files[0]?.name ?? null,
    newestModified: files[0]?.modified ?? null
  }
}

/**
 * Resolves a caller-supplied log name inside the log folder, refusing anything
 * that could escape it.
 *
 * The name is rejected unless it is a bare file name ending in `.log`, and the
 * resolved path is checked again against the folder - so `../../.env`, an
 * absolute path and a URL-encoded traversal all fail before any file is
 * opened.
 */
export const resolveLogFile = (fileName: string): string => {
  const folder = getLogFolder()

  if (!folder)
    throw {
      code: 400,
      status: 'Bad Request',
      message: 'Log folder is not configured.'
    }

  if (
    !fileName ||
    path.basename(fileName) !== fileName ||
    !fileName.toLowerCase().endsWith('.log')
  )
    throw {
      code: 400,
      status: 'Bad Request',
      message: 'Invalid log file name.'
    }

  const folderPath = path.resolve(folder)
  const filePath = path.resolve(folderPath, fileName)

  if (filePath !== path.join(folderPath, fileName))
    throw {
      code: 400,
      status: 'Bad Request',
      message: 'Invalid log file name.'
    }

  return filePath
}

export const DEFAULT_LOG_LINES = 200
export const MAX_LOG_LINES = 5000

/**
 * The last `lines` lines of a log file, read from the end of the file rather
 * than by loading all of it - an access log that has been rotating for a year
 * is not something to read into memory to answer one page view.
 */
export const readLogTail = async (
  fileName: string,
  lines: number = DEFAULT_LOG_LINES
): Promise<LogTail> => {
  const filePath = resolveLogFile(fileName)
  const stats = await statOrNull(filePath)

  if (!stats || !stats.isFile())
    throw {
      code: 404,
      status: 'Not Found',
      message: 'Log file not found.'
    }

  const wanted = Math.min(
    Math.max(Math.trunc(Number(lines)) || DEFAULT_LOG_LINES, 1),
    MAX_LOG_LINES
  )

  // 256 bytes a line is a generous ceiling for an access log line, and the
  // window is capped at 1 MB so a wide read cannot become a memory story.
  const window = Math.min(
    stats.size,
    Math.max(wanted * 256, 64 * 1024),
    1024 * 1024
  )
  const start = Math.max(0, stats.size - window)

  const handle = await fs.promises.open(filePath, 'r')

  try {
    const buffer = Buffer.alloc(window)
    const { bytesRead } = await handle.read(buffer, 0, window, start)

    let text = buffer.subarray(0, bytesRead).toString('utf8')

    // A window that starts mid-line begins with a partial record: drop it
    // unless the window starts at byte 0.
    if (start > 0) {
      const firstBreak = text.indexOf('\n')
      text = firstBreak === -1 ? '' : text.slice(firstBreak + 1)
    }

    const allLines = text.split('\n')

    if (allLines[allLines.length - 1] === '') allLines.pop()

    return {
      fileName,
      lines: wanted,
      bytesRead,
      // `truncated` describes the answer, not the read: earlier lines are
      // missing either because the window started mid-file, or because the
      // caller asked for fewer lines than the file holds.
      truncated: start > 0 || allLines.length > wanted,
      content: allLines.slice(-wanted).join('\n')
    }
  } finally {
    await handle.close()
  }
}

/** The folders the administration screen reports on, in display order. */
export const getReportedFolders = async (): Promise<FolderUsage[]> => {
  const targets: [string, string | undefined][] = [
    ['sasjs_root', getSasjsRootFolder()],
    ['drive', getSasjsDriveFolder()],
    ['drive/files', getFilesFolder()],
    ['sessions', getSessionsFolder()],
    ['logs', getLogFolder()],
    ['uploads', getUploadsFolder()],
    ['webouts', getWeboutFolder()]
  ]

  return Promise.all(
    targets.map(([label, folder]) => getFolderUsage(label, folder))
  )
}
