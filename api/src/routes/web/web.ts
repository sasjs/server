import express from 'express'
import { WebController } from '../../controllers/web'
import { authenticateAccessToken, desktopRestrict } from '../../middlewares'
import { authorizeValidation, loginWebValidation } from '../../utils'
import mockSas9Router from '../api/mock-sas9'

const webRouter = express.Router()
const controller = new WebController()

const { MOCK_SERVERTYPE } = process.env

webRouter.get('/', async (req, res) => {
  let response
  try {
    response = await controller.home()
  } catch (_) {
    response = '<html><head></head><body>Web Build is not present</body></html>'
  } finally {
    const codeToInject = `<script>document.cookie = 'XSRF-TOKEN=${req.csrfToken()}; Max-Age=86400; SameSite=Strict; Path=/;'</script>`
    const injectedContent = response?.replace(
      '</head>',
      `${codeToInject}</head>`
    )

    return res.send(injectedContent)
  }
})

if (MOCK_SERVERTYPE !== undefined) {
  webRouter.post('/SASLogon/login', desktopRestrict, async (req, res) => {
    const { error, value: body } = loginWebValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)
  
    try {
      const response = await controller.login(req, body)
      res.send(response)
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  })
}

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

webRouter.use('/', mockSas9Router)
// disabled for now
// webRouter.use('/', mockViyaRouter)

export default webRouter
