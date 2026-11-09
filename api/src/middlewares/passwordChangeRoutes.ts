import { Request } from 'express'

import { API_PREFIX, canonicalPrefix } from '../utils/routePrefixes'

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
  // Canonicalised: a flagged account may reach these on the short prefix too,
  // and `/api/session` has to mean `/SASjsApi/session` here as it does at the
  // gate.
  const p = canonicalPrefix(req.baseUrl + req.path)
  return (
    p.startsWith(`${API_PREFIX}/auth/updatePassword`) ||
    p === `${API_PREFIX}/session` ||
    p === `${API_PREFIX}/session/` ||
    p.startsWith('/SASLogon/logout')
  )
}
