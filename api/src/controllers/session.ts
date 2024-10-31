import express from 'express'
import { Request, Security, Route, Tags, Example, Get } from 'tsoa'
import { UserResponse } from './user'
import { getSessionController } from './internal'
import { SessionState } from '../types'

interface SessionResponse extends UserResponse {
  needsToUpdatePassword: boolean
}

@Security('bearerAuth')
@Route('SASjsApi/session')
@Tags('Session')
export class SessionController {
  /**
   * @summary Get session info (username).
   *
   */
  @Example<UserResponse>({
    id: 123,
    username: 'johnusername',
    displayName: 'John',
    isAdmin: false
  })
  @Get('/')
  public async session(
    @Request() request: express.Request
  ): Promise<SessionResponse> {
    return session(request)
  }

  /**
   * @summary Get session state (initialising, pending, running, completed, failed).
   * Polling session state won't work in a load-balanced situation.
   * @example completed
   */
  @Get('/:sessionId/state')
  public async sessionState(sessionId: string): Promise<SessionState> {
    return sessionState(sessionId)
  }
}

const session = (req: express.Request) => ({
  id: req.user!.userId,
  username: req.user!.username,
  displayName: req.user!.displayName,
  isAdmin: req.user!.isAdmin,
  needsToUpdatePassword: req.user!.needsToUpdatePassword
})

const sessionState = (sessionId: string): SessionState => {
  for (let runTime of process.runTimes) {
    // get session controller for each available runTime
    const sessionController = getSessionController(runTime)

    // get session by sessionId
    const session = sessionController.getSessionById(sessionId)

    // return session state if session was found
    if (session) {
      return session.state
    }
  }

  throw {
    code: 404,
    message: `Session with ID '${sessionId}' was not found.`
  }
}
