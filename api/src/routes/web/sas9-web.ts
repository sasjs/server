import express from 'express'
import { WebController } from '../../controllers'
import { MockSas9Controller } from '../../controllers/mock-sas9'

const sas9WebRouter = express.Router()
const webController = new WebController()
// Mock controller must be singleton because it keeps the states
// for example `isLoggedIn` and potentially more in future mocks
const controller = new MockSas9Controller()

sas9WebRouter.get('/', async (req, res) => {
  let response
  try {
    response = await webController.home()
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

sas9WebRouter.get('/SASStoredProcess', async (req, res) => {
  const response = await controller.sasStoredProcess(req)

  if (response.redirect) {
    res.redirect(response.redirect)
    return
  }

  try {
    res.send(response.content)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

sas9WebRouter.get('/SASStoredProcess/do/', async (req, res) => {
  const response = await controller.sasStoredProcessDoGet(req)

  if (response.redirect) {
    res.redirect(response.redirect)
    return
  }

  try {
    res.send(response.content)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

sas9WebRouter.post('/SASStoredProcess/do/', async (req, res) => {
  const response = await controller.sasStoredProcessDoPost(req)

  if (response.redirect) {
    res.redirect(response.redirect)
    return
  }

  try {
    res.send(response.content)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

sas9WebRouter.get('/SASLogon/login', async (req, res) => {
  const response = await controller.loginGet()

  try {
    res.send(response.content)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

sas9WebRouter.post('/SASLogon/login', async (req, res) => {
  const response = await controller.loginPost()

  try {
    res.send(response.content)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

sas9WebRouter.get('/SASLogon/logout', async (req, res) => {
  const response = await controller.logout()

  try {
    res.send(response.content)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

export default sas9WebRouter
