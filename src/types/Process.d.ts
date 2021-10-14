declare namespace NodeJS {
  export interface Process {
    sessionController?: import('../controllers/Session').SessionController
  }
}
