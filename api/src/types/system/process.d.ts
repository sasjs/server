declare namespace NodeJS {
  export interface Process {
    sasLoc: string
    driveLoc: string
    sessionController?: import('../../controllers/internal').SessionController
    appStreamConfig: import('../').AppStreamConfig
    logger: import('@sasjs/utils/logger').Logger
  }
}
