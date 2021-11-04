import express from 'express'
import UserController from '../../controllers/user'
import {
  authenticateAccessToken,
  verifyAdmin,
  verifyAdminIfNeeded
} from '../../middlewares'
import User from '../../model/User'
import {
  deleteUserValidation,
  registerUserValidation,
  updateUserValidation
} from '../../utils'

const userRouter = express.Router()

// create user
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

// get one user
userRouter.get('/:username', authenticateAccessToken, async (req: any, res) => {
  const { username } = req.params
  try {
    const user = await User.findOne({ username })
      .select({ _id: 0, username: 1, displayName: 1, isAdmin: 1, isActive: 1 })
      .exec()
    res.send(user)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

// update user
userRouter.patch(
  '/:username',
  authenticateAccessToken,
  verifyAdminIfNeeded,
  async (req: any, res) => {
    const { user } = req
    const { username } = req.params

    // only an admin can update `isActive` and `isAdmin` fields
    const { error, value: body } = updateUserValidation(req.body, user.isAdmin)
    if (error) return res.status(400).send(error.details[0].message)

    const controller = new UserController()
    try {
      const response = await controller.updateUser(username, body)
      res.send(response)
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  }
)

// delete user
userRouter.delete(
  '/:username',
  authenticateAccessToken,
  verifyAdminIfNeeded,
  async (req: any, res) => {
    const { user } = req
    const { username } = req.params

    // only an admin can delete user without providing password
    const { error, value: data } = deleteUserValidation(req.body, user.isAdmin)
    if (error) return res.status(400).send(error.details[0].message)

    const controller = new UserController()
    try {
      await controller.deleteUser(username, data, user.isAdmin)
      res.status(200).send('Account Deleted!')
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  }
)

export default userRouter
