import { Request } from 'express'
import { PreProgramVars } from '../types'
import { resolveListeners } from './resolveListeners'

/**
 * A URL authority holding an IPv6 literal needs brackets - `http://::1:5000` is
 * not parseable, `http://[::1]:5000` is. Hostnames and IPv4 addresses are left
 * alone.
 */
const asUrlHost = (address: string): string => {
  const bracketed = address.startsWith('[') && address.endsWith(']')

  return address.includes(':') && !bracketed ? `[${address}]` : address
}

/**
 * The callback URL for a program this server executes itself - the value the
 * `ms_*` macros in @sasjs/core read as `_sasjs_apiserverurl`.
 *
 * A plain HTTP listener is preferred when one is enabled: the SAS session is a
 * child of this process, so loopback reaches it, and an https callback would make
 * it trust this server's own certificate - which a self-signed or
 * internally-issued one does not provide. With no plain listener the request's
 * origin is the only address available.
 */
const getLocalServerUrl = (req: Request): string => {
  // an explicit override is the operator's statement about reachability, so it
  // wins over anything derived here - for both topologies
  if (process.env.API_SERVER_URL) return process.env.API_SERVER_URL

  const { config } = resolveListeners(process.env)

  if (!config?.httpPort) return `${req.protocol}://${req.get('host')}`

  // a wildcard bind answers on loopback; a specific address is used as written
  const wildcard =
    config.httpBindAddress === '0.0.0.0' || config.httpBindAddress === '::'
  const host = wildcard ? '127.0.0.1' : config.httpBindAddress

  return `http://${asUrlHost(host)}:${config.httpPort}`
}

export const getPreProgramVariables = (req: Request): PreProgramVars => {
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
    // a program submitted to Viya compute runs elsewhere, so it gets the origin
    // the request arrived on rather than this server's loopback
    serverUrl:
      process.env.API_SERVER_URL ?? `${req.protocol}://${req.get('host')}`,
    localServerUrl: getLocalServerUrl(req),
    httpHeaders
  }
}
