import { Request } from 'express'

/**
 * The only routes a password-flagged account may reach: reading its own
 * session (the SPA's session poll), changing its password, and logging out.
 *
 * The session exception is the poll path exactly, not the `/SASjsApi/session`
 * prefix: the prefix also covers the per-session endpoints, so a flagged
 * account could otherwise read the log and the webout of a triggered program
 * before it had ever changed its password.
 *
 * It lives in its own module so a spec can exercise it without importing the
 * router that uses it.
 */
export const isPasswordChangeRoute = (req: Request): boolean => {
  const p = req.baseUrl + req.path
  return (
    p.startsWith('/SASjsApi/auth/updatePassword') ||
    p === '/SASjsApi/session' ||
    p === '/SASjsApi/session/' ||
    p.startsWith('/SASLogon/logout')
  )
}
