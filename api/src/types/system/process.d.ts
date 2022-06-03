declare namespace NodeJS {
  export interface Process {
    runTimes: string[]
    sasLoc: string
    driveLoc: string
    sasSessionController?: import('../../controllers/internal').SASSessionController
    jsSessionController?: import('../../controllers/internal').JSSessionController
    appStreamConfig: import('../').AppStreamConfig
    logger: import('@sasjs/utils/logger').Logger
  }
}
