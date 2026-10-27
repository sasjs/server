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
  /** Lines actually returned in `content`. */
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
const STAT_CONCURRENCY = 32

interface WalkTotals {
  bytes: number
  files: number
  truncated: boolean
  /** Totals per leading path segment, relative to the folder that was walked. */
  byPrefix: Map<string, { bytes: number; files: number }>
}

/**
 * One walk of a folder tree.
 *
 * Two things make this cheaper than the obvious version, because diagnostics
 * runs it on the request path (on tab mount and on every Refresh):
 *
 * - the stat calls run in bounded batches rather than one awaited stat at a
 *   time, which on a large SASJS_ROOT was seconds of serialised IO;
 * - the per-prefix totals let a caller derive the child folders (`drive`,
 *   `sessions`, ...) from the same walk instead of walking the tree again for
 *   each of them.
 *
 * Symlinks are counted as entries but never followed: a link to `/` or to its
 * own parent would otherwise walk the filesystem or loop.
 */
const walkFolder = async (
  folder: string,
  cap: number = MAX_ENTRIES
): Promise<WalkTotals> => {
  const totals: WalkTotals = {
    bytes: 0,
    files: 0,
    truncated: false,
    byPrefix: new Map()
  }

  const rootPath = path.resolve(folder)
  const pendingDirs: string[] = [rootPath]
  const files: string[] = []
  let entries = 0
  let truncated = false

  while (pendingDirs.length && !truncated) {
    const current = pendingDirs.pop() as string

    let dirents: fs.Dirent[]

    try {
      dirents = await fs.promises.readdir(current, { withFileTypes: true })
    } catch (error) {
      // Unreadable subfolder: keep what has been counted so far.
      continue
    }

    for (const dirent of dirents) {
      if (entries >= cap) {
        truncated = true
        break
      }

      entries++

      if (dirent.isSymbolicLink()) continue

      const fullPath = path.join(current, dirent.name)

      if (dirent.isDirectory()) {
        pendingDirs.push(fullPath)
        continue
      }

      if (dirent.isFile()) files.push(fullPath)
    }
  }

  for (let index = 0; index < files.length; index += STAT_CONCURRENCY) {
    const batch = files.slice(index, index + STAT_CONCURRENCY)
    const sizes = await Promise.all(
      batch.map(async (filePath) => {
        const stats = await statOrNull(filePath)

        return stats && stats.isFile() ? stats.size : null
      })
    )

    sizes.forEach((size, position) => {
      if (size === null) return

      const segments = path.relative(rootPath, batch[position]).split(path.sep)
      const keys = [segments[0]]

      if (segments.length > 1) keys.push(segments.slice(0, 2).join('/'))

      totals.bytes += size
      totals.files++

      for (const key of keys) {
        const entry = totals.byPrefix.get(key) ?? { bytes: 0, files: 0 }

        entry.bytes += size
        entry.files++
        totals.byPrefix.set(key, entry)
      }
    })
  }

  totals.truncated = truncated

  return totals
}

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

  const totals = await walkFolder(folder)

  return {
    label,
    path: folder,
    exists: true,
    bytes: totals.bytes,
    files: totals.files,
    truncated: totals.truncated
  }
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
 * Two guards, because the first is not enough on its own: the name must be a
 * bare file name ending in `.log` (so `..`, an absolute path and a traversal
 * die before any file is touched), and the resolved path must still be under
 * the resolved log folder. The second check is what stops a symlink *inside*
 * the log folder pointing somewhere else - a lexical check alone follows it.
 * Symlinks are refused outright rather than resolved: the folder holds files
 * the server wrote.
 */
export const resolveLogFile = async (fileName: string): Promise<string> => {
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

  const folderPath = await fs.promises.realpath(folder).catch(() => null)

  if (!folderPath)
    throw {
      code: 400,
      status: 'Bad Request',
      message: 'Log folder is not readable.'
    }

  const candidate = path.join(folderPath, fileName)
  const entry = await fs.promises.lstat(candidate).catch(() => null)

  if (!entry)
    throw {
      code: 404,
      status: 'Not Found',
      message: 'Log file not found.'
    }

  if (entry.isSymbolicLink())
    throw {
      code: 400,
      status: 'Bad Request',
      message: 'Invalid log file name.'
    }

  const real = await fs.promises.realpath(candidate).catch(() => null)

  if (!real)
    throw {
      code: 404,
      status: 'Not Found',
      message: 'Log file not found.'
    }

  if (real !== candidate && !real.startsWith(folderPath + path.sep))
    throw {
      code: 400,
      status: 'Bad Request',
      message: 'Invalid log file name.'
    }

  return real
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
  const filePath = await resolveLogFile(fileName)
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

    const returned = allLines.slice(-wanted)

    return {
      fileName,
      // How many lines `content` actually holds, not what was asked for: a
      // short file or a capped window must not be reported as a full answer.
      lines: returned.length,
      bytesRead,
      // `truncated` describes the answer, not the read: earlier lines are
      // missing either because the window started mid-file, or because the
      // caller asked for fewer lines than the file holds.
      truncated: start > 0 || allLines.length > wanted,
      content: returned.join('\n')
    }
  } finally {
    await handle.close()
  }
}

/** The folders the administration screen reports on, in display order. */
export const getReportedFolders = async (): Promise<FolderUsage[]> => {
  const root = getSasjsRootFolder()
  const rootPath = root ? path.resolve(root) : ''
  const rootStats = rootPath ? await statOrNull(rootPath) : null
  const rootTotals =
    rootPath && rootStats?.isDirectory() ? await walkFolder(rootPath) : null

  // The prefix is the path of the folder relative to SASJS_ROOT, which is how a
  // child row is derived from the single walk rather than walked again. A folder
  // that is configured outside the root (a logs folder on another mount, say)
  // has no prefix and falls back to its own walk.
  const targets: [string, string | undefined, string][] = [
    ['sasjs_root', root, ''],
    ['drive', getSasjsDriveFolder(), 'drive'],
    ['drive/files', getFilesFolder(), 'drive/files'],
    ['sessions', getSessionsFolder(), 'sessions'],
    ['logs', getLogFolder(), 'logs'],
    ['uploads', getUploadsFolder(), 'uploads'],
    ['webouts', getWeboutFolder(), 'webouts']
  ]

  const rows: FolderUsage[] = []

  for (const [label, folder, prefix] of targets) {
    const resolved = folder ? path.resolve(folder) : ''
    const nestsInsideRoot =
      !!rootTotals &&
      prefix !== '' &&
      resolved === path.join(rootPath, ...prefix.split('/'))

    if (rootTotals && prefix === '' && resolved === rootPath) {
      rows.push({
        label,
        path: folder as string,
        exists: true,
        bytes: rootTotals.bytes,
        files: rootTotals.files,
        truncated: rootTotals.truncated
      })
      continue
    }

    if (nestsInsideRoot) {
      const derived = rootTotals.byPrefix.get(prefix) ?? { bytes: 0, files: 0 }
      // Absence is still a real question: a configured child that does not
      // exist is not the same as an empty one.
      const exists = !!(await statOrNull(resolved))

      rows.push(
        exists
          ? {
              label,
              path: folder as string,
              exists: true,
              bytes: derived.bytes,
              files: derived.files,
              truncated: rootTotals.truncated
            }
          : {
              label,
              path: folder as string,
              exists: false,
              bytes: 0,
              files: 0,
              truncated: false,
              error: 'not found'
            }
      )
      continue
    }

    rows.push(await getFolderUsage(label, folder))
  }

  return rows
}
