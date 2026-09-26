import express from 'express'
import { generateCSRFToken } from '../../middlewares'
import { WebController } from '../../controllers/web'
import {
  authenticateAccessToken,
  bruteForceProtection,
  desktopRestrict
} from '../../middlewares'
import {
  authorizeValidation,
  loginWebValidation,
  isAuthProviderEnabled,
  AuthProviderType
} from '../../utils'

const webRouter = express.Router()
const controller = new WebController()

webRouter.get('/', async (req, res) => {
  let response
  try {
    response = await controller.home()
  } catch (_) {
    response = '<html><head></head><body>Web Build is not present</body></html>'
  } finally {
    const { ALLOWED_DOMAIN } = process.env
    const allowedDomain = ALLOWED_DOMAIN?.trim()
    const domain = allowedDomain ? ` Domain=${allowedDomain};` : ''
    const codeToInject = `<script>document.cookie = 'XSRF-TOKEN=${generateCSRFToken(req)};${domain} Max-Age=86400; SameSite=Strict; Path=/;'</script>`
    const injectedContent = response?.replace(
      '</head>',
      `${codeToInject}</head>`
    )

    return res.send(injectedContent)
  }
})

webRouter.post(
  '/SASLogon/login',
  desktopRestrict,
  bruteForceProtection,
  async (req, res) => {
    const { error, value: body } = loginWebValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    try {
      const response = await controller.login(req, body)
      res.send(response)
    } catch (err: any) {
      if (err instanceof Error) {
        res.status(500).send(err.toString())
      } else {
        res.status(err.code).send(err.message)
      }
    }
  }
)

webRouter.post(
  '/SASLogon/authorize',
  desktopRestrict,
  authenticateAccessToken,
  async (req, res) => {
    const { error, value: body } = authorizeValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    try {
      const response = await controller.authorize(req, body)
      res.send(response)
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  }
)

webRouter.get('/SASLogon/logout', desktopRestrict, async (req, res) => {
  try {
    await controller.logout(req)
    res.status(200).send('OK!')
  } catch (err: any) {
    res.status(403).send(err.toString())
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

  if (err instanceof Error) return res.status(500).send(err.toString())

  return res.status(err.code ?? 500).send(err.message ?? 'Sign-in failed.')
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
      res.redirect(302, url)
    } catch (err: any) {
      sendOidcError(res, err)
    }
  }
)

export default webRouter
