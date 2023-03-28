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
    sessionController?: import('../../controllers/internal').SessionController
    sasSessionController?: import('../../controllers/internal').SASSessionController
    appStreamConfig: import('../').AppStreamConfig
    logger: import('@sasjs/utils/logger').Logger
    runTimes: import('../../utils').RunTimeType[]
    secrets: import('../../model/Configuration').ConfigurationType
    dbInstance: import('mongoose').Mongoose
  }
}
