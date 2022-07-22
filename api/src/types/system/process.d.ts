declare namespace NodeJS {
  export interface Process {
    sasLoc?: string
    nodeLoc?: string
    driveLoc: string
    logsLoc: string
    sasSessionController?: import('../../controllers/internal').SASSessionController
    jsSessionController?: import('../../controllers/internal').JSSessionController
    appStreamConfig: import('../').AppStreamConfig
    logger: import('@sasjs/utils/logger').Logger
    runTimes: import('../../utils').RunTimeType[]
    secrets: import('../../model/Configuration').ConfigurationType
  }
}
