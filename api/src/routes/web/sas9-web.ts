import express from 'express'
import {
  setCSRFCookie,
  drainBody,
  authenticateAccessToken
} from '../../middlewares'
import { ModeType, publicUser } from '../../utils'
import { WebController } from '../../controllers'
import { MockSas9Controller } from '../../controllers/mock-sas9'
import dotenv from 'dotenv'
import { FileUploadController } from '../../controllers/internal'
import { normalizeTierQuery } from '../../utils/tierQuery'

dotenv.config({ quiet: true })

const sas9WebRouter = express.Router()
const webController = new WebController()
// Mock controller must be singleton because it keeps the states
// for example `isLoggedIn` and potentially more in future mocks
const controller = new MockSas9Controller()
const fileUploadController = new FileUploadController()

// Mock login is not server authentication. Use the same execute permission as
// /SASjsApi/stp/execute, but never admit the anonymous public identity.
const authenticateMockExecution: express.RequestHandler = (req, res, next) => {
  if (process.env.MODE === ModeType.Desktop) {
    // GET previously relied on the app's desktop identity; keep that behavior.
    return req.method === 'POST'
      ? authenticateAccessToken(req, res, next)
      : next()
  }
  const url = req.url
  const baseUrl = req.baseUrl
  req.url = '/stp/execute'
  req.baseUrl = '/SASjsApi'
  return authenticateAccessToken(req, res, (error?: unknown) => {
    req.url = url
    req.baseUrl = baseUrl
    if (error) return next(error)
    if (!req.user || req.user.userId === publicUser.userId) {
      return drainBody(req).then(() => res.status(401).send('Unauthorized'))
    }
    next()
  })
}

// The mock's login form posts application/x-www-form-urlencoded; the parser
// is scoped here rather than mounted globally in app.ts.
sas9WebRouter.use(express.urlencoded({ extended: true }))

// Express 5 parses req.query from req.url on access. Rewrite names only, before
// upload validation and the mock handlers; preserve all raw values and pairs.
sas9WebRouter.use((req, _res, next) => {
  // Only the two tier endpoints, not Logoff or other paths.
  if (/^\/sasstoredprocess(?:\/do)?\/?$/i.test(req.path)) {
    const queryStart = req.url.indexOf('?')
    req.url =
      req.url.slice(0, queryStart < 0 ? undefined : queryStart) +
      normalizeTierQuery(req.url).search
  }
  next()
})

sas9WebRouter.get('/', async (req, res) => {
  let response
  try {
    response = await webController.home()
  } catch (_) {
    response = '<html><head></head><body>Web Build is not present</body></html>'
  }

  setCSRFCookie(req, res)

  return res.send(response)
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

sas9WebRouter.get(
  '/SASStoredProcess/do/',
  authenticateMockExecution,
  async (req, res) => {
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
  }
)

sas9WebRouter.post(
  '/SASStoredProcess/do/',
  async (req, res, next) => {
    // Match the mock controller's POST refusals before a session or upload is
    // created. Keep its own checks too: login state can change during upload.
    const redirect = controller.postLoginRedirect()
    if (redirect) {
      await drainBody(req)
      return res.redirect(redirect)
    }
    next()
  },
  authenticateMockExecution,
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

sas9WebRouter.get('/SASLogon/login', async (_req, res) => {
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
