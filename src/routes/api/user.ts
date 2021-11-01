import express from 'express'
import bcrypt from 'bcryptjs'
import User from '../../model/User'
import { registerValidation } from '../../utils'

const userRouter = express.Router()

userRouter.post('/', async (req, res) => {
  const { error, value } = registerValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  const { displayname, username, password, isadmin, isactive } = value

  // Checking if user is already in the database
  const usernameExist = await User.findOne({ username })
  if (usernameExist) return res.status(400).send('Username already exists.')

  // Hash passwords
  const salt = await bcrypt.genSalt(10)
  const hashPassword = await bcrypt.hash(password, salt)

  // Create a new user
  const user = new User({
    displayname,
    username,
    password: hashPassword,
    isadmin,
    isactive
  })

  try {
    const savedUser = await user.save()
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
