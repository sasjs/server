import express from 'express'
declare module 'express-session' {
  interface SessionData {
    loggedIn: boolean
    user: import('../').RequestUser
  }
}
