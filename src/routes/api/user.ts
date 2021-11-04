import express from 'express'
import UserController from '../../controllers/user'
import {
  authenticateAccessToken,
  verifyAdmin,
  verifyAdminIfNeeded
} from '../../middlewares'
import {
  deleteUserValidation,
  registerUserValidation,
  updateUserValidation
} from '../../utils'

const userRouter = express.Router()

userRouter.post('/', authenticateAccessToken, verifyAdmin, async (req, res) => {
  const { error, value: body } = registerUserValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  const controller = new UserController()
  try {
    const response = await controller.createUser(body)
    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

userRouter.get('/', authenticateAccessToken, async (req, res) => {
  const controller = new UserController()
  try {
    const response = await controller.getAllUsers()
    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

userRouter.get('/:userId', authenticateAccessToken, async (req: any, res) => {
  const { userId } = req.params

  const controller = new UserController()
  try {
    const response = await controller.getUser(userId)
    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

userRouter.patch(
  '/:userId',
  authenticateAccessToken,
  verifyAdminIfNeeded,
  async (req: any, res) => {
    const { user } = req
    const { userId } = req.params

    // only an admin can update `isActive` and `isAdmin` fields
    const { error, value: body } = updateUserValidation(req.body, user.isAdmin)
    if (error) return res.status(400).send(error.details[0].message)

    const controller = new UserController()
    try {
      const response = await controller.updateUser(userId, body)
      res.send(response)
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  }
)

userRouter.delete(
  '/:userId',
  authenticateAccessToken,
  verifyAdminIfNeeded,
  async (req: any, res) => {
    const { user } = req
    const { userId } = req.params

    // only an admin can delete user without providing password
    const { error, value: data } = deleteUserValidation(req.body, user.isAdmin)
    if (error) return res.status(400).send(error.details[0].message)

    const controller = new UserController()
    try {
      await controller.deleteUser(userId, data, user.isAdmin)
      res.status(200).send('Account Deleted!')
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  }
)

export default userRouter
