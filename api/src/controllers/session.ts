import express from 'express'
import { Request, Security, Route, Tags, Example, Get } from 'tsoa'
import { UserResponse } from './user'
import { getSessionController } from './internal'
import { SessionState } from '../types'

interface SessionResponse extends Omit<UserResponse, 'uid'> {
  id: string
  needsToUpdatePassword?: boolean
}

@Security('bearerAuth')
@Route('SASjsApi/session')
@Tags('Session')
export class SessionController {
  /**
   * @summary Get session info (username).
   *
   */
  @Example<SessionResponse>({
    id: 'userIdString',
    username: 'johnusername',
    displayName: 'John',
    isAdmin: false,
    needsToUpdatePassword: false
  })
  @Get('/')
  public async session(
    @Request() request: express.Request
  ): Promise<SessionResponse> {
    return session(request)
  }

  /**
   * The polling endpoint is currently implemented for single-server deployments only.<br>
   * Load balanced / grid topologies will be supported in a future release.<br>
   * If your site requires this, please reach out to SASjs Support.
   * @summary Get session state (initialising, pending, running, completed, failed).
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
