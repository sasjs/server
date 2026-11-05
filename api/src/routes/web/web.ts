import express from 'express'
import { convertSecondsToHms } from '@sasjs/utils'
import { setCSRFCookie } from '../../middlewares'
import { WebController } from '../../controllers/web'
import {
  authenticateAccessToken,
  csrfProtection,
  desktopRestrict
} from '../../middlewares'
import {
  getLoginLockoutRemaining,
  recordLoginFailure,
  resetLoginFailures
} from '../../utils/loginThrottle'
import {
  authorizeValidation,
  loginWebValidation,
  isAuthProviderEnabled,
  AuthProviderType
} from '../../utils'

const webRouter = express.Router()
const controller = new WebController()

/**
 * A refusal as the client reads it: the status the controller chose, and the
 * message as plain text. The document states these statuses, so they are fixed
 * where the refusal is decided rather than inferred from the shape of the
 * thrown value.
 */
const sendRefusal = (res: express.Response, err: any) => {
  const status = err?.status ?? err?.code ?? 500
  return res
    .status(status)
    .send(err instanceof Error ? err.message : String(err?.message ?? err))
}

webRouter.get('/', async (req, res) => {
  let response
  try {
    response = await controller.home()
  } catch (_) {
    response = '<html><head></head><body>Web Build is not present</body></html>'
  }

  // The page carries no inline script: the CSRF token reaches the browser as a
  // cookie header, so the default Content-Security-Policy needs no
  // `'unsafe-inline'`.
  setCSRFCookie(req, res)

  return res.send(response)
})

webRouter.post(
  '/SASLogon/login',
  csrfProtection,
  desktopRestrict,
  async (req, res) => {
    const { error, value: body } = loginWebValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    const lockoutRemaining = getLoginLockoutRemaining(body.username)
    if (lockoutRemaining > 0) {
      // The seconds are the machine-readable form of the same answer: a client
      // that shows a countdown should not have to parse the message.
      res.setHeader('Retry-After', String(lockoutRemaining))
      return res
        .status(429)
        .send(
          `Too Many Failed Attempts! This account is locked. Retry after ${convertSecondsToHms(
            lockoutRemaining
          )}.`
        )
    }

    try {
      const response = await controller.login(req, body)
      resetLoginFailures(body.username)
      res.send(response)
    } catch (err: any) {
      // A wrong password and an unknown username are both failures worth
      // counting: the lockout must also cover an attacker who is guessing
      // usernames, and responding identically to both keeps the lockout
      // from leaking which name exists.
      recordLoginFailure(body.username)
      sendRefusal(res, err)
    }
  }
)

webRouter.post(
  '/SASLogon/authorize',
  csrfProtection,
  desktopRestrict,
  authenticateAccessToken,
  async (req, res) => {
    const { error, value: body } = authorizeValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    try {
      const response = await controller.authorize(req, body)
      res.send(response)
    } catch (err: any) {
      sendRefusal(res, err)
    }
  }
)

webRouter.get('/SASLogon/logout', desktopRestrict, async (req, res) => {
  try {
    await controller.logout(req)

    // The session has just been replaced, so the token the browser holds is
    // bound to a session that no longer exists. Hand back one that matches the
    // new session, or the next login is refused with 'Invalid CSRF token!'
    // (sasjs/server#304). The client keeps its cookie jar across a logout, so
    // this is the only chance to correct it without another round trip.
    setCSRFCookie(req, res)

    res.status(200).send('OK!')
  } catch (err: any) {
    sendRefusal(res, err)
  }
})

/**
 * The OIDC endpoints are only meaningful when the provider is configured.
 * Without this they would fail deep inside OIDCClient.init() as a 500.
 */
const oidcOnly: express.RequestHandler = (req, res, next) => {
  if (!isAuthProviderEnabled(AuthProviderType.OIDC))
    return res.status(404).send('Not Found')

  next()
}

/**
 * These are browser redirect endpoints, and the refusal message can carry text
 * derived from the provider, so the response is explicitly plain text rather
 * than the text/html express picks for a string body.
 */
const sendOidcError = (res: express.Response, err: any) => {
  res.type('text/plain')

  sendRefusal(res, err)
}

webRouter.get(
  '/SASLogon/openid',
  desktopRestrict,
  oidcOnly,
  async (req, res) => {
    try {
      const { url } = await controller.startOidc(req)
      res.redirect(302, url)
    } catch (err: any) {
      sendOidcError(res, err)
    }
  }
)

webRouter.get(
  '/SASLogon/openid/callback',
  desktopRestrict,
  oidcOnly,
  async (req, res) => {
    try {
      const { url } = await controller.oidcCallback(req)
      res.redirect(302, url)
    } catch (err: any) {
      sendOidcError(res, err)
    }
  }
)

webRouter.get(
  '/SASLogon/openid/logout',
  desktopRestrict,
  oidcOnly,
  async (req, res) => {
    try {
      const { url } = await controller.oidcLogout(req)

      // Same reason as /SASLogon/logout: the session was replaced, so the
      // browser's token no longer matches. Set on the redirect, which the browser
      // stores before following it.
      setCSRFCookie(req, res)

      res.redirect(302, url)
    } catch (err: any) {
      sendOidcError(res, err)
    }
  }
)

export default webRouter
