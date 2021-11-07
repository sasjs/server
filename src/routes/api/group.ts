import express from 'express'
import GroupController from '../../controllers/group'
import { authenticateAccessToken, verifyAdmin } from '../../middlewares'
import { registerGroupValidation } from '../../utils'
import userRouter from './user'

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
      res.status(403).send(err.toString())
    }
  }
)

groupRouter.get('/', authenticateAccessToken, async (req, res) => {
  const controller = new GroupController()
  try {
    const response = await controller.getAllGroups()
    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

groupRouter.get('/:groupId', authenticateAccessToken, async (req: any, res) => {
  const { groupId } = req.params

  const controller = new GroupController()
  try {
    const response = await controller.getGroup(groupId)
    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

groupRouter.post(
  '/:groupId/:userId',
  authenticateAccessToken,
  async (req: any, res) => {
    const { groupId, userId } = req.params

    const controller = new GroupController()
    try {
      const response = await controller.addUserToGroup(groupId, userId)
      res.send(response)
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  }
)

groupRouter.delete(
  '/:groupId/:userId',
  authenticateAccessToken,
  async (req: any, res) => {
    const { groupId, userId } = req.params

    const controller = new GroupController()
    try {
      const response = await controller.removeUserFromGroup(groupId, userId)
      res.send(response)
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  }
)

groupRouter.delete(
  '/:groupId',
  authenticateAccessToken,
  async (req: any, res) => {
    const { groupId } = req.params

    const controller = new GroupController()
    try {
      await controller.deleteGroup(groupId)
      res.status(200).send('Group Deleted!')
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  }
)

export default groupRouter
