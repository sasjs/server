declare namespace NodeJS {
  export interface Process {
    sasLoc: string
    driveLoc: string
    sessionController?: import('../controllers/internal').SessionController
  }
}
