import { PreProgramVars } from '../types'

export const getPreProgramVariables = (req: any): PreProgramVars => {
  const host = req.get('host')
  const protocol = req.protocol + '://'
  const { user, accessToken } = req
  const csrfToken = req.headers['x-xsrf-token']
  const sessionId = req.cookies['connect.sid']

  const httpHeaders: string[] = []

  if (accessToken) httpHeaders.push(`Authorization: Bearer ${accessToken}`)
  if (csrfToken) httpHeaders.push(`x-xsrf-token: ${csrfToken}`)
  if (sessionId) httpHeaders.push(`cookie: connect.sid=${sessionId}`)

  return {
    username: user.username,
    userId: user.userId,
    displayName: user.displayName,
    serverUrl: protocol + host,
    httpHeaders
  }
}
