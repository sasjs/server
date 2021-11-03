import bcrypt from 'bcryptjs'
import User from '../model/User'

export const createUser = async (data: any) => {
  const { displayName, username, password, isAdmin, isActive } = data

  // Checking if user is already in the database
  const usernameExist = await User.findOne({ username })
  if (usernameExist) throw new Error('Username already exists.')

  // Hash passwords
  const salt = await bcrypt.genSalt(10)
  const hashPassword = await bcrypt.hash(password, salt)

  // Create a new user
  const user = new User({
    displayName,
    username,
    password: hashPassword,
    isAdmin,
    isActive
  })

  const savedUser = await user.save()

  return {
    displayName: savedUser.displayName,
    username: savedUser.username,
    isAdmin: savedUser.isAdmin,
    isActive: savedUser.isActive
  }
}
