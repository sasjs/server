import bcrypt from 'bcryptjs'
import User from '../model/User'

export const updateUser = async (currentUsername: string, data: any) => {
  const { displayName, username, password, isAdmin, isActive } = data

  const params: any = { displayName, isAdmin, isActive }

  if (username && currentUsername !== username) {
    // Checking if username is already in the database
    const usernameExist = await User.findOne({ username })
    if (usernameExist) throw new Error('Username already exists.')

    params.username = username
  }

  if (password) {
    // Hash passwords
    const salt = await bcrypt.genSalt(10)
    params.password = await bcrypt.hash(password, salt)
  }

  const updatedUser = await User.findOneAndUpdate(
    { username: currentUsername },
    params,
    { new: true }
  )

  return {
    displayName: updatedUser.displayName,
    username: updatedUser.username,
    isAdmin: updatedUser.isAdmin,
    isActive: updatedUser.isActive
  }
}
