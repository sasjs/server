import express from 'express'
import { UserController } from '../../controllers/'
import {
  authenticateAccessToken,
  verifyAdmin,
  verifyAdminIfNeeded,
  ldapRestrict
} from '../../middlewares'
import {
  deleteUserValidation,
  getUserValidation,
  registerUserValidation,
  updateUserValidation
} from '../../utils'

const userRouter = express.Router()

userRouter.post(
  '/',
  ldapRestrict,
  authenticateAccessToken,
  verifyAdmin,
  async (req, res) => {
    const { error, value: body } = registerUserValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    const controller = new UserController()
    try {
      const response = await controller.createUser(body)
      res.send(response)
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  }
)

userRouter.get('/', authenticateAccessToken, async (req, res) => {
  const controller = new UserController()
  try {
    const response = await controller.getAllUsers()
    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

userRouter.get(
  '/by/username/:username',
  authenticateAccessToken,
  async (req, res) => {
    const { error, value: params } = getUserValidation(req.params)
    if (error) return res.status(400).send(error.details[0].message)

    const { username } = params

    const controller = new UserController()
    try {
      const response = await controller.getUserByUsername(req, username)
      res.send(response)
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  }
)

userRouter.get('/:userId', authenticateAccessToken, async (req, res) => {
  const { userId } = req.params

  const controller = new UserController()
  try {
    const response = await controller.getUser(req, parseInt(userId))
    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

userRouter.patch(
  '/by/username/:username',
  ldapRestrict,
  authenticateAccessToken,
  verifyAdminIfNeeded,
  async (req, res) => {
    const { user } = req
    const { error: errorUsername, value: params } = getUserValidation(
      req.params
    )
    if (errorUsername)
      return res.status(400).send(errorUsername.details[0].message)

    const { username } = params

    // only an admin can update `isActive` and `isAdmin` fields
    const { error, value: body } = updateUserValidation(req.body, user!.isAdmin)
    if (error) return res.status(400).send(error.details[0].message)

    const controller = new UserController()
    try {
      const response = await controller.updateUserByUsername(username, body)
      res.send(response)
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  }
)

userRouter.patch(
  '/:userId',
  ldapRestrict,
  authenticateAccessToken,
  verifyAdminIfNeeded,
  async (req, res) => {
    const { user } = req
    const { userId } = req.params

    // only an admin can update `isActive` and `isAdmin` fields
    const { error, value: body } = updateUserValidation(req.body, user!.isAdmin)
    if (error) return res.status(400).send(error.details[0].message)

    const controller = new UserController()
    try {
      const response = await controller.updateUser(parseInt(userId), body)
      res.send(response)
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  }
)

userRouter.delete(
  '/by/username/:username',
  ldapRestrict,
  authenticateAccessToken,
  verifyAdminIfNeeded,
  async (req, res) => {
    const { user } = req
    const { error: errorUsername, value: params } = getUserValidation(
      req.params
    )
    if (errorUsername)
      return res.status(400).send(errorUsername.details[0].message)

    const { username } = params

    // only an admin can delete user without providing password
    const { error, value: data } = deleteUserValidation(req.body, user!.isAdmin)
    if (error) return res.status(400).send(error.details[0].message)

    const controller = new UserController()
    try {
      await controller.deleteUserByUsername(username, data, user!.isAdmin)
      res.status(200).send('Account Deleted!')
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  }
)

userRouter.delete(
  '/:userId',
  ldapRestrict,
  authenticateAccessToken,
  verifyAdminIfNeeded,
  async (req, res) => {
    const { user } = req
    const { userId } = req.params

    // only an admin can delete user without providing password
    const { error, value: data } = deleteUserValidation(req.body, user!.isAdmin)
    if (error) return res.status(400).send(error.details[0].message)

    const controller = new UserController()
    try {
      await controller.deleteUser(parseInt(userId), data, user!.isAdmin)
      res.status(200).send('Account Deleted!')
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  }
)

export default userRouter
