/**
 * Throttling for password verification, keyed on the username.
 *
 * Keying on the IP is not viable behind a reverse proxy - every client
 * shares the proxy's address, so one attacker's failures lock out the
 * whole deployment (that is why the previous IP-keyed limiter was
 * removed outright). The username is the stable key: it is validated by
 * the login schema (lowercase alphanumerics), it is what an attacker
 * must guess, and in the small trusted user base this server targets,
 * a lockout is resolved by a word to an admin rather than a support
 * ticket.
 *
 * Counters live in process memory: single-container deployments
 * restart to zero, which is acceptable for a lockout this short.
 */

const failures: { [username: string]: number } = {}
const lockedUntil: { [username: string]: number } = {}

export const getLoginThrottleConfig = (): {
  maxFailures: number
  lockoutMs: number
} => ({
  maxFailures: Number(process.env.MAX_LOGIN_FAILURES ?? 5),
  lockoutMs: Number(process.env.LOGIN_LOCKOUT_MINUTES ?? 15) * 60 * 1000
})

/**
 * Seconds until the username is usable again, or 0 when it is not
 * locked out.
 */
export const getLoginLockoutRemaining = (username: string): number => {
  const expiresAt = lockedUntil[username.toLowerCase()]
  if (expiresAt === undefined) return 0

  const remaining = expiresAt - Date.now()
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0
}

export const isLoginLockedOut = (username: string): boolean =>
  getLoginLockoutRemaining(username) > 0

export const recordLoginFailure = (username: string): void => {
  const key = username.toLowerCase()
  const { maxFailures, lockoutMs } = getLoginThrottleConfig()

  failures[key] = (failures[key] ?? 0) + 1

  if (failures[key] >= maxFailures) {
    lockedUntil[key] = Date.now() + lockoutMs
    process.logger?.warn(
      `Login for ${key} locked out after ${failures[key]} failed attempts`
    )
  }
}

export const resetLoginFailures = (username: string): void => {
  const key = username.toLowerCase()
  delete failures[key]
  delete lockedUntil[key]
}
