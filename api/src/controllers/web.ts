import path from 'path'
import express from 'express'
import { Request, Route, Tags, Post, Body, Get } from 'tsoa'
import { readFile } from '@sasjs/utils'

import User from '../model/User'
import { getWebBuildFolderPath } from '../utils'

@Route('/')
@Tags('Web')
export class WebController {
  /**
   * @summary Render index.html
   *
   */
  @Get('/')
  public async home(@Request() req: express.Request) {
    return home(req)
  }

  /**
   * @summary Accept a valid username/password
   *
   */
  @Post('/login')
  public async login(
    @Request() req: express.Request,
    @Body() body: LoginPayload
  ) {
    return login(req, body)
  }

  /**
   * @summary Accept a valid username/password
   *
   */
  @Get('/logout')
  public async logout(@Request() req: express.Request) {
    return new Promise((resolve) => {
      req.session.destroy(() => {
        resolve(true)
      })
    })
  }
}

const home = async (req: express.Request) => {
  const indexHtmlPath = path.join(getWebBuildFolderPath(), 'index.html')

  // Attention! Cannot use fileExists here,
  // due to limitation after building executable
  const content = await readFile(indexHtmlPath)

  req.res?.cookie('XSRF-TOKEN', req.csrfToken())
  req.res?.setHeader('Content-Type', 'text/html')

  return content
}

const login = async (
  req: express.Request,
  { username, password }: LoginPayload
) => {
  // Authenticate User
  const user = await User.findOne({ username })
  if (!user) throw new Error('Username is not found.')

  const validPass = user.comparePassword(password)
  if (!validPass) throw new Error('Invalid password.')

  req.session.loggedIn = true
  req.session.user = {
    userId: user.id,
    clientId: 'web_app',
    username: user.username,
    displayName: user.displayName,
    isAdmin: user.isAdmin,
    isActive: user.isActive
  }

  return {
    loggedIn: true,
    user: {
      username: user.username,
      displayName: user.displayName
    }
  }
}

interface LoginPayload {
  /**
   * Username for user
   * @example "secretuser"
   */
  username: string
  /**
   * Password for user
   * @example "secretpassword"
   */
  password: string
}
