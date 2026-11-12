import express from 'express'
import { UserController } from '../../controllers/'
import {
  authenticateAccessToken,
  verifyAdmin,
  verifyAdminIfNeeded
} from '../../middlewares'
import {
  deleteUserValidation,
  desktopProfileValidation,
  getUserValidation,
  ModeType,
  registerUserValidation,
  uidValidation,
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
    res.status(err.code).send(err.message)
  }
})

userRouter.get('/', authenticateAccessToken, async (req, res) => {
  const controller = new UserController()
  try {
    const response = await controller.getAllUsers()
    res.send(response)
  } catch (err: any) {
    res.status(err.code).send(err.message)
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
      res.status(err.code).send(err.message)
    }
  }
)

userRouter.get('/:uid', authenticateAccessToken, async (req, res) => {
  const { error, value: params } = uidValidation(req.params)
  if (error) return res.status(400).send(error.details[0].message)

  const { uid } = params

  const controller = new UserController()
  try {
    const response = await controller.getUser(req, uid)
    res.send(response)
  } catch (err: any) {
    res.status(err.code).send(err.message)
  }
})

userRouter.patch(
  '/by/username/:username',
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
    // Desktop mode validates only what it lets the caller change: the account's name is the
    // operating system's and the Settings screen echoes it back on every save.
    const { error, value: body } =
      process.env.MODE === ModeType.Desktop
        ? desktopProfileValidation(req.body)
        : updateUserValidation(req.body, user!.isAdmin)
    if (error) return res.status(400).send(error.details[0].message)

    const controller = new UserController()
    try {
      const response = await controller.updateUserByUsername(username, body)
      res.send(response)
    } catch (err: any) {
      res.status(err.code).send(err.message)
    }
  }
)

userRouter.patch(
  '/:uid',
  authenticateAccessToken,
  verifyAdminIfNeeded,
  async (req, res) => {
    const { user } = req

    const { error: uidError, value: params } = uidValidation(req.params)
    if (uidError) return res.status(400).send(uidError.details[0].message)

    const { uid } = params

    // only an admin can update `isActive` and `isAdmin` fields
    // Desktop mode validates only what it lets the caller change: the account's name is the
    // operating system's and the Settings screen echoes it back on every save.
    const { error, value: body } =
      process.env.MODE === ModeType.Desktop
        ? desktopProfileValidation(req.body)
        : updateUserValidation(req.body, user!.isAdmin)
    if (error) return res.status(400).send(error.details[0].message)

    const controller = new UserController()
    try {
      const response = await controller.updateUser(uid, body)
      res.send(response)
    } catch (err: any) {
      res.status(err.code).send(err.message)
    }
  }
)

userRouter.delete(
  '/by/username/:username',
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
      res.status(err.code).send(err.message)
    }
  }
)

userRouter.delete(
  '/:uid',
  authenticateAccessToken,
  verifyAdminIfNeeded,
  async (req, res) => {
    const { user } = req

    const { error: uidError, value: params } = uidValidation(req.params)
    if (uidError) return res.status(400).send(uidError.details[0].message)

    const { uid } = params

    // only an admin can delete user without providing password
    const { error, value: data } = deleteUserValidation(req.body, user!.isAdmin)
    if (error) return res.status(400).send(error.details[0].message)

    const controller = new UserController()
    try {
      await controller.deleteUser(uid, data, user!.isAdmin)
      res.status(200).send('Account Deleted!')
    } catch (err: any) {
      res.status(err.code).send(err.message)
    }
  }
)

export default userRouter
