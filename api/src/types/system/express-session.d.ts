import express from 'express'
declare module 'express-session' {
  interface SessionData {
    loggedIn: boolean
    user: {
      userId: number
      clientId: string
      username: string
      displayName: string
      isAdmin: boolean
      isActive: boolean
    }
  }
}
