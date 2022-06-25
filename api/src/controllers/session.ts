import express from 'express'
import { Request, Security, Route, Tags, Example, Get } from 'tsoa'
import { UserResponse } from './user'

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
  ): Promise<UserResponse> {
    return session(request)
  }
}

const session = (req: express.Request) => ({
  id: req.user!.userId,
  username: req.user!.username,
  displayName: req.user!.displayName,
  isAdmin: req.user!.isAdmin
})
