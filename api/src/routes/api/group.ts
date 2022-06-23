import express from 'express'
import { GroupController } from '../../controllers/'
import { authenticateAccessToken, verifyAdmin } from '../../middlewares'
import { getGroupValidation, registerGroupValidation } from '../../utils'

const groupRouter = express.Router()

groupRouter.post(
  '/',
  authenticateAccessToken,
  verifyAdmin,
  async (req, res) => {
    const { error, value: body } = registerGroupValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    const controller = new GroupController()
    try {
      const response = await controller.createGroup(body)
      res.send(response)
    } catch (err: any) {
      const statusCode = err.code

      delete err.code

      res.status(statusCode).send(err.message)
    }
  }
)

groupRouter.get('/', authenticateAccessToken, async (req, res) => {
  const controller = new GroupController()
  try {
    const response = await controller.getAllGroups()
    res.send(response)
  } catch (err: any) {
    const statusCode = err.code

    delete err.code

    res.status(statusCode).send(err.message)
  }
})

groupRouter.get('/:groupId', authenticateAccessToken, async (req, res) => {
  const { groupId } = req.params

  const controller = new GroupController()
  try {
    const response = await controller.getGroup(parseInt(groupId))
    res.send(response)
  } catch (err: any) {
    const statusCode = err.code

    delete err.code

    res.status(statusCode).send(err.message)
  }
})

groupRouter.get(
  '/by/groupname/:name',
  authenticateAccessToken,
  async (req, res) => {
    const { error, value: params } = getGroupValidation(req.params)
    if (error) return res.status(400).send(error.details[0].message)

    const { name } = params

    const controller = new GroupController()
    try {
      const response = await controller.getGroupByGroupName(name)
      res.send(response)
    } catch (err: any) {
      const statusCode = err.code

      delete err.code

      res.status(statusCode).send(err.message)
    }
  }
)

groupRouter.post(
  '/:groupId/:userId',
  authenticateAccessToken,
  verifyAdmin,
  async (req, res) => {
    const { groupId, userId } = req.params

    const controller = new GroupController()
    try {
      const response = await controller.addUserToGroup(
        parseInt(groupId),
        parseInt(userId)
      )
      res.send(response)
    } catch (err: any) {
      const statusCode = err.code

      delete err.code

      res.status(statusCode).send(err.message)
    }
  }
)

groupRouter.delete(
  '/:groupId/:userId',
  authenticateAccessToken,
  verifyAdmin,
  async (req, res) => {
    const { groupId, userId } = req.params

    const controller = new GroupController()
    try {
      const response = await controller.removeUserFromGroup(
        parseInt(groupId),
        parseInt(userId)
      )
      res.send(response)
    } catch (err: any) {
      const statusCode = err.code

      delete err.code

      res.status(statusCode).send(err.message)
    }
  }
)

groupRouter.delete(
  '/:groupId',
  authenticateAccessToken,
  verifyAdmin,
  async (req, res) => {
    const { groupId } = req.params

    const controller = new GroupController()
    try {
      await controller.deleteGroup(parseInt(groupId))
      res.status(200).send('Group Deleted!')
    } catch (err: any) {
      const statusCode = err.code

      delete err.code

      res.status(statusCode).send(err.message)
    }
  }
)

export default groupRouter
