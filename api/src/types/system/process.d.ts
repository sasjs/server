declare namespace NodeJS {
  export interface Process {
    sasLoc?: string
    nodeLoc?: string
    pythonLoc?: string
    rscriptLoc?: string
    driveLoc: string
    logsLoc: string
    logsUUID: string
    sasSessionController?: import('../../controllers/internal').SASSessionController
    jsSessionController?: import('../../controllers/internal').JSSessionController
    pythonSessionController?: import('../../controllers/internal').PythonSessionController
    rSessionController?: import('../../controllers/internal').RSessionController
    appStreamConfig: import('../').AppStreamConfig
    logger: import('@sasjs/utils/logger').Logger
    runTimes: import('../../utils').RunTimeType[]
    secrets: import('../../model/Configuration').ConfigurationType
  }
}
