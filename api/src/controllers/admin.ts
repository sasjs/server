import {
  Route,
  Tags,
  Example,
  Get,
  Path,
  Query,
  Response,
  Security
} from 'tsoa'
import { createAdminService, isApiError, type AdminReports } from '@sasjs/api'
import {
  BuildInfo,
  DEFAULT_LOG_LINES,
  FilesystemUsage,
  FolderUsage,
  LogFileInfo,
  LogFolderSummary,
  LogTail
} from '../utils'
import { adminReports } from './internal/adminReports'

/**
 * The package refuses with an `ApiError` carrying `status`, because that is what
 * both hosts share; this router answers `{ code, message }`, which is what
 * `sendError` reads. Translate at the boundary rather than teaching `sendError`
 * a second vocabulary - the drive and session controllers do the same.
 */
const through = async <T>(work: () => Promise<T>): Promise<T> => {
  try {
    return await work()
  } catch (error) {
    if (isApiError(error)) throw { code: error.status, message: error.message }

    throw error
  }
}

export interface ServerDetails {
  mode: string
  uptimeSeconds: number
  startedAt: string
  /**
   * OS process id of the server process.
   * @isInt
   */
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

export interface MemoryDetails {
  rssBytes: number
  heapTotalBytes: number
  heapUsedBytes: number
  externalBytes: number
  systemTotalBytes: number
  systemFreeBytes: number
}

export interface DiagnosticsResponse {
  build: BuildInfo
  server: ServerDetails
  memory: MemoryDetails
  filesystem: FilesystemUsage | null
  folders: FolderUsage[]
  logs: LogFolderSummary
}

export interface LogFilesResponse {
  files: LogFileInfo[]
}

/**
 * Read-only operational information for administrators.
 *
 * Every route here is mounted behind `authenticateAccessToken` and
 * `verifyAdmin` in routes/api/index.ts (see the `client` and `authConfig`
 * routers for the same shape), so the caller is known to be an administrator
 * before a handler runs. Nothing here writes.
 */
@Route('SASjsApi/admin')
@Tags('Admin')
export class AdminController {
  /**
   * The reports are injectable so a spec can hand the service a report that is
   * missing a field - which is the only way to prove the package's normalisers
   * still guard the host, rather than the host's own typing doing it.
   */
  constructor(private readonly reports: AdminReports = adminReports()) {}

  /**
   * Reports what this server is running and how it is using the machine:
   * the release tag and commit the binary was built from, process uptime and
   * memory, the free space on the filesystem holding SASJS_ROOT, and the size
   * of each folder underneath it.
   *
   * Folder sizes are best-effort: a subfolder that cannot be read contributes
   * an `error` field, and a walk that stops at the entry cap is marked
   * `truncated`, rather than the whole answer failing.
   *
   * @summary Diagnostics: version, uptime, memory, disk usage
   */
  @Example<DiagnosticsResponse>({
    build: {
      version: 'v3.2.2',
      gitHash: '4a26a3d',
      buildDate: '2026-10-27T19:41:38.000Z'
    },
    server: {
      mode: 'server',
      uptimeSeconds: 3600,
      startedAt: '2026-10-27T20:00:00.000Z',
      pid: 1462058,
      nodeVersion: 'v22.11.0',
      platform: 'linux 5.14.0',
      arch: 'x64',
      cpuCount: 8,
      cpuModel: 'Intel(R) Xeon(R) CPU',
      loadAverage: [0.08, 0.11, 0.15],
      runTimes: ['sas'],
      sasjsRoot: '/home/sasjssrv/sasjs_root'
    },
    memory: {
      rssBytes: 214302720,
      heapTotalBytes: 41943040,
      heapUsedBytes: 31457280,
      externalBytes: 12582912,
      systemTotalBytes: 66571993088,
      systemFreeBytes: 61203283968
    },
    filesystem: {
      path: '/home/sasjssrv/sasjs_root',
      totalBytes: 468151435264,
      freeBytes: 114890375168,
      usedBytes: 353261060096,
      usedPercent: 75.5
    },
    folders: [
      {
        label: 'sessions',
        path: '/home/sasjssrv/sasjs_root/sessions',
        exists: true,
        bytes: 346341376,
        files: 2411,
        truncated: false
      }
    ],
    logs: {
      folder: '/home/sasjssrv/sasjs_root/logs',
      fileCount: 42,
      totalBytes: 43008000,
      newestFile: '20261027210826.log',
      newestModified: '2026-10-27T21:09:41.000Z'
    }
  })
  @Response(
    401,
    'Unauthorized, or an administrator account is required. The mount point in routes/api/index.ts applies both checks before this handler runs.'
  )
  @Response(500, 'The diagnostics could not be read')
  @Security('bearerAuth')
  @Get('/diagnostics')
  public async diagnostics(): Promise<DiagnosticsResponse> {
    // the readings are this host's; the checking of them is the package's, so a
    // host that cannot read its filesystem states `null` and a host that cannot
    // read anything refuses the request instead of rendering a page of zeroes
    const answer = await through(() =>
      createAdminService(this.reports).diagnostics()
    )

    return answer as DiagnosticsResponse
  }

  /**
   * Lists the access logs the server has written, newest first, with their
   * sizes - so an operator can see at a glance whether the log folder is
   * growing and which file to read.
   *
   * @summary List the server's log files
   */
  @Example<LogFilesResponse>({
    files: [
      {
        name: '20261027210826.log',
        sizeBytes: 2979977,
        modified: '2026-10-27T21:09:41.000Z'
      }
    ]
  })
  @Response(
    401,
    'Unauthorized, or an administrator account is required. The mount point in routes/api/index.ts applies both checks before this handler runs.'
  )
  @Response(500, 'The log folder could not be listed')
  @Security('bearerAuth')
  @Get('/logs')
  public async logs(): Promise<LogFilesResponse> {
    return {
      files: await through(() => createAdminService(this.reports).logs())
    }
  }

  /**
   * Returns the end of one log file.
   *
   * `fileName` must be a bare file name ending in `.log`; anything that could
   * resolve outside the log folder is refused with `400`, and a name that does
   * not exist inside it with `404`. The read starts near the end of the file,
   * so a large log costs a bounded read rather than a full one, and
   * `truncated` says whether earlier lines exist.
   *
   * @summary Read the tail of a log file
   * @param fileName Name of the log file, as returned by GET /logs
   * @param lines How many trailing lines to return (default 200, max 5000)
   */
  @Example<LogTail>({
    fileName: '20261027210826.log',
    lines: 200,
    bytesRead: 65536,
    truncated: true,
    content:
      '::ffff:127.0.0.1 - - [27/Oct/2026:21:09:41 +0000] "GET /SASjsApi/info HTTP/1.1" 200 118'
  })
  @Response(400, 'Invalid log file name.')
  @Response(
    401,
    'Unauthorized, or an administrator account is required. The mount point in routes/api/index.ts applies both checks before this handler runs.'
  )
  @Response(404, 'Log file not found.')
  @Response(500, 'The log file could not be read')
  @Security('bearerAuth')
  @Get('/logs/{fileName}')
  public async logTail(
    @Path() fileName: string,
    // optional rather than defaulted: the package applies the documented default
    // and the ceiling, and a default here would mean its `logLines()` never sees
    // an absent value - so this host would be the one deciding both
    @Query() lines?: number
  ): Promise<LogTail> {
    // the name rule, the `lines` default and ceiling, and the unknown-name answer
    // are the package's; the host supplies readings, not rules
    return through(
      () =>
        createAdminService(this.reports).logTail(
          fileName,
          lines
        ) as Promise<LogTail>
    )
  }
}
