import express from 'express'
import { generateCSRFToken } from '../../middlewares'
import { WebController } from '../../controllers/web'
import { authenticateAccessToken, desktopRestrict } from '../../middlewares'
import { authorizeValidation, loginWebValidation } from '../../utils'

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
    const codeToInject = `<script>document.cookie = 'XSRF-TOKEN=${generateCSRFToken()};${domain} Max-Age=86400; SameSite=Strict; Path=/;'</script>`
    const injectedContent = response?.replace(
      '</head>',
      `${codeToInject}</head>`
    )

    return res.send(injectedContent)
  }
})

webRouter.post('/SASLogon/login', desktopRestrict, async (req, res) => {
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
})

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

export default webRouter
