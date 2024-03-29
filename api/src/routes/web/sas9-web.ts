import express from 'express'
import { generateCSRFToken } from '../../middlewares'
import { WebController } from '../../controllers'
import { MockSas9Controller } from '../../controllers/mock-sas9'
import multer from 'multer'
import path from 'path'
import dotenv from 'dotenv'
import { FileUploadController } from '../../controllers/internal'

dotenv.config()

const sas9WebRouter = express.Router()
const webController = new WebController()
// Mock controller must be singleton because it keeps the states
// for example `isLoggedIn` and potentially more in future mocks
const controller = new MockSas9Controller()
const fileUploadController = new FileUploadController()

const mockPath = process.env.STATIC_MOCK_LOCATION || 'mocks'

const upload = multer({
  dest: path.join(process.cwd(), mockPath, 'sas9', 'files-received')
})

sas9WebRouter.get('/', async (req, res) => {
  let response
  try {
    response = await webController.home()
  } catch (_) {
    response = '<html><head></head><body>Web Build is not present</body></html>'
  } finally {
    const codeToInject = `<script>document.cookie = 'XSRF-TOKEN=${generateCSRFToken()}; Max-Age=86400; SameSite=Strict; Path=/;'</script>`
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

sas9WebRouter.post(
  '/SASStoredProcess/do/',
  fileUploadController.preUploadMiddleware,
  fileUploadController.getMulterUploadObject().any(),
  async (req, res) => {
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
  }
)

sas9WebRouter.get('/SASLogon/login', async (req, res) => {
  const response = await controller.loginGet()

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

sas9WebRouter.post('/SASLogon/login', async (req, res) => {
  const response = await controller.loginPost(req)

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

sas9WebRouter.get('/SASLogon/logout', async (req, res) => {
  const response = await controller.logout(req)

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

sas9WebRouter.get('/SASStoredProcess/Logoff', async (req, res) => {
  const response = await controller.logoff(req)

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

export default sas9WebRouter
