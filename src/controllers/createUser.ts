import bcrypt from 'bcryptjs'
import User from '../model/User'

export const createUser = async (data: any) => {
  const { displayname, username, password, isadmin, isactive } = data

  // Checking if user is already in the database
  const usernameExist = await User.findOne({ username })
  if (usernameExist) throw new Error('Username already exists.')

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

  const savedUser = await user.save()

  return {
    displayname: savedUser.displayname,
    username: savedUser.username,
    isadmin: savedUser.isadmin,
    isactive: savedUser.isactive
  }
}
