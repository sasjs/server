import bcrypt from 'bcryptjs'
import User from '../model/User'

export const deleteUser = async (
  username: string,
  isAdmin: boolean,
  data: any
) => {
  const { password } = data

  const user = await User.findOne({ username })
  if (!user) throw new Error('Username is not found.')

  if (!isAdmin) {
    const validPass = await bcrypt.compare(password, user.password)
    if (!validPass) throw new Error('Invalid password.')
  }

  await User.deleteOne({ username })
}
