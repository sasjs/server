import express from 'express'
import { createUser } from '../../controllers/createUser'
import { updateUser } from '../../controllers/updateUser'
import { deleteUser } from '../../controllers/deleteUser'
import { authenticateAccessToken, verifyAdmin } from '../../middlewares'
import User from '../../model/User'
import {
  deleteUserValidation,
  registerUserValidation,
  updateUserValidation
} from '../../utils'

const userRouter = express.Router()

userRouter.post('/', authenticateAccessToken, verifyAdmin, async (req, res) => {
  const { error, value: data } = registerUserValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const savedUser = await createUser(data)
    res.send(savedUser)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

userRouter.get('/', authenticateAccessToken, async (req, res) => {
  try {
    const users = await User.find({})
      .select({ _id: 0, username: 1, displayName: 1, isAdmin: 1, isActive: 1 })
      .exec()
    res.send(users)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

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

userRouter.patch(
  '/:username',
  authenticateAccessToken,
  async (req: any, res) => {
    const { user } = req
    const { username } = req.params

    // only an admin can update other users
    if (!user.isAdmin && user.username !== username) {
      return res.status(401).send('Admin account required')
    }

    // only an admin can update `isActive` and `isAdmin` fields
    const { error, value: data } = updateUserValidation(req.body, user.isAdmin)
    if (error) return res.status(400).send(error.details[0].message)

    try {
      const user = await updateUser(username, data)
      res.send(user)
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  }
)

userRouter.delete(
  '/:username',
  authenticateAccessToken,
  async (req: any, res) => {
    const { user } = req
    const { username } = req.params

    // only an admin can delete other users
    if (!user.isAdmin && user.username !== username) {
      return res.status(401).send('Admin account required')
    }

    const { error, value: data } = deleteUserValidation(req.body, user.isAdmin)
    if (error) return res.status(400).send(error.details[0].message)

    try {
      await deleteUser(username, user.isAdmin, data)
      res.status(200).send('Account Deleted!')
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  }
)

export default userRouter
