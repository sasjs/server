declare namespace NodeJS {
  export interface Process {
    sasLoc?: string
    nodeLoc?: string
    pythonLoc?: string
    rLoc?: string
    driveLoc: string
    sasjsRoot: string
    logsLoc: string
    logsUUID: string
    /** Present only in an executable built by pkg. */
    pkg?: unknown
    sessionController?: import('../../controllers/internal').SessionController
    sasSessionController?: import('../../controllers/internal').SASSessionController
    logger: import('@sasjs/utils/logger').Logger
    runTimes: import('../../utils').RunTimeType[]
    secrets: import('../../model/Configuration').ConfigurationType
  }
}
