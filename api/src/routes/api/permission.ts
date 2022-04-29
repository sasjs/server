import express from 'express'
import { PermissionController } from '../../controllers/'
import { authenticateAccessToken, verifyAdmin } from '../../middlewares'
import { registerPermissionValidation } from '../../utils'

const permissionRouter = express.Router()
const controller = new PermissionController()

permissionRouter.get('/', authenticateAccessToken, async (req, res) => {
  try {
    const response = await controller.getAllPermissions()
    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

permissionRouter.post(
  '/',
  authenticateAccessToken,
  verifyAdmin,
  async (req, res) => {
    const { error, value: body } = registerPermissionValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    try {
      const response = await controller.createPermission(body)
      res.send(response)
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  }
)

export default permissionRouter
