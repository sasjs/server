import express from 'express'
import { createUser } from '../../controllers/createUser'
import { registerValidation } from '../../utils'

const userRouter = express.Router()

userRouter.post('/', async (req, res) => {
  const { error, value: data } = registerValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const savedUser = await createUser(data)
    res.send({
      displayname: savedUser.displayname,
      username: savedUser.username,
      isadmin: savedUser.isadmin,
      isactive: savedUser.isactive
    })
  } catch (err) {
    res.status(400).send(err)
  }
})

export default userRouter
