declare namespace NodeJS {
  export interface Process {
    sasLoc: string
    driveLoc: string
    sasSessionController?: import('../../controllers/internal').SASSessionController
    jsSessionController?: import('../../controllers/internal').JSSessionController
    appStreamConfig: import('../').AppStreamConfig
    logger: import('@sasjs/utils/logger').Logger
    runTimes: import('../../utils').RunTimeType[]
  }
}
