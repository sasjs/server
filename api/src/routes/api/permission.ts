import express from 'express'
import { PermissionController } from '../../controllers/'
import { authenticateAccessToken, verifyAdmin } from '../../middlewares'
import {
  registerPermissionValidation,
  updatePermissionValidation
} from '../../utils'

const permissionRouter = express.Router()
const controller = new PermissionController()

permissionRouter.get('/', authenticateAccessToken, async (req, res) => {
  try {
    const response = await controller.getAllPermissions()
    res.send(response)
  } catch (err: any) {
    const statusCode = err.code
    delete err.code
    res.status(statusCode).send(err.message)
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
      const statusCode = err.code
      delete err.code
      res.status(statusCode).send(err.message)
    }
  }
)

permissionRouter.patch(
  '/:permissionId',
  authenticateAccessToken,
  verifyAdmin,
  async (req: any, res) => {
    const { permissionId } = req.params

    const { error, value: body } = updatePermissionValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    try {
      const response = await controller.updatePermission(permissionId, body)
      res.send(response)
    } catch (err: any) {
      const statusCode = err.code
      delete err.code
      res.status(statusCode).send(err.message)
    }
  }
)

permissionRouter.delete(
  '/:permissionId',
  authenticateAccessToken,
  verifyAdmin,
  async (req: any, res) => {
    const { permissionId } = req.params

    try {
      await controller.deletePermission(permissionId)
      res.status(200).send('Permission Deleted!')
    } catch (err: any) {
      const statusCode = err.code
      delete err.code
      res.status(statusCode).send(err.message)
    }
  }
)
export default permissionRouter
