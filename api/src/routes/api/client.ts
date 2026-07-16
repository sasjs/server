import express from 'express'
import { ClientController } from '../../controllers'
import { registerClientValidation } from '../../utils'
import { authenticateAccessToken, verifyAdmin } from '../../middlewares'

const clientRouter = express.Router()

// Neither this route nor the router itself declares auth middleware - both
// POST and GET are actually gated by authenticateAccessToken/verifyAdmin
// applied at the mount point in routes/api/index.ts (`router.use('/client',
// ..., authenticateAccessToken, verifyAdmin, clientRouter)`), which runs for
// every method under /client before requests reach the handlers below. GET's
// own authenticateAccessToken/verifyAdmin a few lines down is therefore
// redundant, not the thing actually protecting it.
clientRouter.post('/', async (req, res) => {
  const { error, value: body } = registerClientValidation(req.body)

  if (error) return res.status(400).send(error.details[0].message)

  const controller = new ClientController()
  try {
    const response = await controller.createClient(body)
    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

clientRouter.get(
  '/',
  authenticateAccessToken,
  verifyAdmin,
  async (req, res) => {
    const controller = new ClientController()
    try {
      const response = await controller.getAllClients()
      res.send(response)
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  }
)

export default clientRouter
