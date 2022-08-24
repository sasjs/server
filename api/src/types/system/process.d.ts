declare namespace NodeJS {
  export interface Process {
    sasLoc?: string
    nodeLoc?: string
    pythonLoc?: string
    driveLoc: string
    logsLoc: string
    logsUUID: string
    sasSessionController?: import('../../controllers/internal').SASSessionController
    jsSessionController?: import('../../controllers/internal').JSSessionController
    pythonSessionController?: import('../../controllers/internal').PythonSessionController
    appStreamConfig: import('../').AppStreamConfig
    logger: import('@sasjs/utils/logger').Logger
    runTimes: import('../../utils').RunTimeType[]
    secrets: import('../../model/Configuration').ConfigurationType
  }
}
