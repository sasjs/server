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
      res.status(err.code).send(err.message)
    }
  }
)

groupRouter.get('/', authenticateAccessToken, async (req, res) => {
  const controller = new GroupController()
  try {
    const response = await controller.getAllGroups()
    res.send(response)
  } catch (err: any) {
    res.status(err.code).send(err.message)
  }
})

groupRouter.get('/:uid', authenticateAccessToken, async (req, res) => {
  const { uid } = req.params

  const controller = new GroupController()
  try {
    const response = await controller.getGroup(uid)
    res.send(response)
  } catch (err: any) {
    res.status(err.code).send(err.message)
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
      const response = await controller.getGroupByName(name)
      res.send(response)
    } catch (err: any) {
      res.status(err.code).send(err.message)
    }
  }
)

groupRouter.post(
  '/:groupUid/:userUid',
  authenticateAccessToken,
  verifyAdmin,
  async (req, res) => {
    const { groupUid, userUid } = req.params

    const controller = new GroupController()
    try {
      const response = await controller.addUserToGroup(groupUid, userUid)
      res.send(response)
    } catch (err: any) {
      console.log('err :>> ', err)
      res.status(err.code).send(err.message)
    }
  }
)

groupRouter.delete(
  '/:groupUid/:userUid',
  authenticateAccessToken,
  verifyAdmin,
  async (req, res) => {
    const { groupUid, userUid } = req.params

    const controller = new GroupController()
    try {
      const response = await controller.removeUserFromGroup(groupUid, userUid)
      res.send(response)
    } catch (err: any) {
      res.status(err.code).send(err.message)
    }
  }
)

groupRouter.delete(
  '/:uid',
  authenticateAccessToken,
  verifyAdmin,
  async (req, res) => {
    const { uid } = req.params

    const controller = new GroupController()
    try {
      await controller.deleteGroup(uid)
      res.status(200).send('Group Deleted!')
    } catch (err: any) {
      res.status(err.code).send(err.message)
    }
  }
)

export default groupRouter
