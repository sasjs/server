declare namespace Express {
  export interface Request {
    accessToken?: string
    user?: import('../').RequestUser
    sasSession?: import('../').Session
  }
}
