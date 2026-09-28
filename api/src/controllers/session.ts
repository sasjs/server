import express from 'express'
import { Request, Security, Route, Tags, Example, Get } from 'tsoa'
import { UserResponse } from './user'
import { getSessionController } from './internal'
import { SessionState } from '../types'

interface SessionResponse extends UserResponse {
  needsToUpdatePassword?: boolean
}

@Security('bearerAuth')
@Route('SASjsApi/session')
@Tags('Session')
export class SessionController {
  /**
   * Returns the properties of the authenticated user as held in the session:
   * their id, username, display name, whether they are an administrator, and
   * whether they still have to change their password.
   *
   * @summary Get the current session
   */
  @Example<SessionResponse>({
    uid: 'userIdString',
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
   * Returns the current state of a session created by `POST /SASjsApi/code/trigger`
   * or `POST /SASjsApi/stp/trigger`.
   *
   * The state is one of `initialising`, `pending`, `running`, `completed` or
   * `failed`. A `404` is returned when no session has that id.
   *
   * Polling is implemented for single-server deployments only; load-balanced and
   * grid topologies are not yet supported. If your site requires this, please
   * contact SASjs Support.
   *
   * @summary Get the state of a session
   */
  @Example<SessionState>(SessionState.completed)
  @Get('/:sessionId/state')
  public async sessionState(sessionId: string): Promise<SessionState> {
    return sessionState(sessionId)
  }
}

const session = (req: express.Request) => ({
  uid: req.user!.userId,
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
