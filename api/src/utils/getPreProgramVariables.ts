import { Request } from 'express'
import { PreProgramVars } from '../types'

export const getPreProgramVariables = (req: Request): PreProgramVars => {
  const host = req.get('host')
  const protocol = req.protocol + '://'
  const { user, accessToken } = req
  const csrfToken = req.headers['x-xsrf-token'] || req.cookies['XSRF-TOKEN']
  const sessionId = req.cookies['connect.sid']

  const httpHeaders: string[] = []

  if (accessToken) httpHeaders.push(`Authorization: Bearer ${accessToken}`)
  if (csrfToken) httpHeaders.push(`x-xsrf-token: ${csrfToken}`)

  const cookies: string[] = []
  if (sessionId) cookies.push(`connect.sid=${sessionId}`)

  if (cookies.length) httpHeaders.push(`cookie: ${cookies.join('; ')}`)

  //In desktop mode when mocking mode is enabled, user was undefined.
  //So this is workaround.
  return {
    username: user ? user.username : 'demo',
    userId: user ? user.userId : 'demoId',
    displayName: user ? user.displayName : 'demo',
    serverUrl: protocol + host,
    httpHeaders
  }
}
