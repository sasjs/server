import { PreProgramVars } from '../types'

export const getPreProgramVariables = (req: any): PreProgramVars => {
  const host = req.get('host')
  const protocol = req.protocol + '://'
  const { user, accessToken } = req
  const csrfToken = req.headers['x-xsrf-token'] || req.cookies['XSRF-TOKEN']
  const sessionId = req.cookies['connect.sid']
  const { _csrf } = req.cookies

  const httpHeaders: string[] = []

  if (accessToken) httpHeaders.push(`Authorization: Bearer ${accessToken}`)
  if (csrfToken) httpHeaders.push(`x-xsrf-token: ${csrfToken}`)

  const cookies: string[] = []
  if (sessionId) cookies.push(`connect.sid=${sessionId}`)
  if (_csrf) cookies.push(`_csrf=${_csrf}`)

  if (cookies.length) httpHeaders.push(`cookie: ${cookies.join('; ')}`)

  return {
    username: user.username,
    userId: user.userId,
    displayName: user.displayName,
    serverUrl: protocol + host,
    httpHeaders
  }
}
