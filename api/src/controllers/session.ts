import express from 'express'
import { Request, Security, Route, Tags, Example, Get } from 'tsoa'
import { UserResponse } from './user'

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
}

const session = (req: express.Request) => ({
  id: req.user!.userId,
  username: req.user!.username,
  displayName: req.user!.displayName,
  isAdmin: req.user!.isAdmin,
  needsToUpdatePassword: req.user!.needsToUpdatePassword
})
