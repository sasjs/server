declare namespace Express {
  export interface Request {
    accessToken?: string
    user?: import('../').RequestUser
    sasjsSession?: import('../').Session
  }
}
