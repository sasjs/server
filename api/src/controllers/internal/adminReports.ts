import type { AdminReports } from '@sasjs/api'

import {
  getBuildInfo,
  getFilesystemUsage,
  getLogFolderSummary,
  getProcessMetrics,
  getReportedFolders,
  getSasjsRootFolder,
  listLogFiles,
  readLogTail
} from '../../utils'

/**
 * The three readings `@sasjs/api`'s admin service needs, from this host.
 *
 * Deliberately thin: the values are what the server already computed, and the
 * decisions - which log names are legal, what `lines` defaults to and its
 * ceiling, what an unknown name answers - are the package's. Moving them here
 * would be the second implementation the adoption exists to remove.
 */
export const adminReports = (): AdminReports => ({
  diagnostics: async () => {
    const metrics = getProcessMetrics()
    const sasjsRoot = getSasjsRootFolder()

    return {
      build: getBuildInfo(),
      server: {
        mode: process.env.MODE ?? 'desktop',
        uptimeSeconds: metrics.uptimeSeconds,
        startedAt: metrics.startedAt,
        pid: metrics.pid,
        nodeVersion: metrics.nodeVersion,
        platform: metrics.platform,
        arch: metrics.arch,
        cpuCount: metrics.cpuCount,
        cpuModel: metrics.cpuModel,
        loadAverage: metrics.loadAverage,
        // Not set when the process is bootstrapped in test mode, where
        // setProcessVariables returns before it reads RUN_TIMES.
        runTimes: process.runTimes ?? [],
        sasjsRoot: sasjsRoot ?? ''
      },
      memory: {
        ...metrics.processMemory,
        systemTotalBytes: metrics.systemMemory.totalBytes,
        systemFreeBytes: metrics.systemMemory.freeBytes
      },
      filesystem: await getFilesystemUsage(sasjsRoot),
      folders: await getReportedFolders(),
      logs: await getLogFolderSummary()
    }
  },

  logs: () => listLogFiles(),

  // the port answers `undefined` for a file that is not there, and the package
  // turns that into the `404` - so the refusal a client sees is the documented
  // one. `readLogTail` throws instead, which is the shape its other callers want,
  // so the translation belongs here. A name that resolves outside the folder is
  // refused by `resolveLogFile` with its own code and is rethrown: the host knows
  // things this port does not (a symlink, an unreadable folder).
  logTail: async (fileName, lines) => {
    try {
      return await readLogTail(fileName, lines)
    } catch (error: any) {
      if (error?.code === 404) return undefined

      throw error
    }
  }
})
