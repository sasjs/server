import express from 'express'
import { InfoController } from '../../controllers'
import { authenticateAccessToken, verifyAdmin } from '../../middlewares'

const infoRouter = express.Router()

// Public by design: the login screen needs mode/runTimes/authProviders (and
// the OIDC provider name) BEFORE anyone is authenticated. Nothing sensitive
// is served here - the CORS whitelist deliberately is not part of the
// response.
infoRouter.get('/', async (req, res) => {
  const controller = new InfoController()
  try {
    const response = controller.info()
    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

// The route inventory is only used by the admin permission dialog; serving it
// pre-auth was pure reconnaissance value.
infoRouter.get(
  '/authorizedRoutes',
  authenticateAccessToken,
  verifyAdmin,
  async (req, res) => {
    const controller = new InfoController()
    try {
      const response = controller.authorizedRoutes()
      res.send(response)
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  }
)

export default infoRouter
