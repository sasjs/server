import {
  Route,
  Path,
  Query,
  Example,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Hidden
} from 'tsoa'
import bcrypt from 'bcryptjs'

import User, { UserPayload } from '../model/User'

interface userResponse {
  username: string
  displayName: string
}

interface userDetailsResponse {
  displayName: string
  username: string
  isActive: boolean
  isAdmin: boolean
}

@Route('user')
export default class UserController {
  /**
   * Get list of all users (username, displayname). All users can request this.
   *
   */
  @Example<userResponse[]>([
    {
      username: 'johnusername',
      displayName: 'John'
    },
    {
      username: 'starkusername',
      displayName: 'Stark'
    }
  ])
  @Get('/')
  public async getAllUsers(): Promise<userResponse[]> {
    return getAllUsers()
  }

  /**
   * Create user with the following attributes: UserId, UserName, Password, isAdmin, isActive. Admin only task.
   *
   */
  @Example<userDetailsResponse>({
    displayName: 'John Snow',
    username: 'johnSnow01',
    isAdmin: false,
    isActive: true
  })
  @Post('/')
  public async createUser(
    @Body() body: UserPayload
  ): Promise<userDetailsResponse> {
    return createUser(body)
  }

  /**
   * Update user properties - such as displayName. Can be performed either by admins, or the user in question.
   * @param username The user's identifier
   * @example username "johnSnow01"
   */
  @Example<userDetailsResponse>({
    displayName: 'John Snow',
    username: 'johnSnow01',
    isAdmin: false,
    isActive: true
  })
  @Patch('{username}')
  public async updateUser(
    @Path() username: string,
    @Body() body: UserPayload
  ): Promise<userDetailsResponse> {
    return updateUser(username, body)
  }

  /**
   * Delete a user. Can be performed either by admins, or the user in question.
   * @param username The user's identifier
   * @example username "johnSnow01"
   */
  @Delete('{username}')
  public async deleteUser(
    @Path() username: string,
    @Body() body: { password?: string },
    @Query() @Hidden() isAdmin: boolean = false
  ) {
    return deleteUser(username, isAdmin, body)
  }
}

const getAllUsers = async () =>
  await User.find({}).select({ _id: 0, username: 1, displayName: 1 }).exec()

const createUser = async (data: any): Promise<userDetailsResponse> => {
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

const updateUser = async (currentUsername: string, data: any) => {
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
  if (!updatedUser) throw new Error('Unable to update user')

  return {
    displayName: updatedUser.displayName,
    username: updatedUser.username,
    isAdmin: updatedUser.isAdmin,
    isActive: updatedUser.isActive
  }
}

const deleteUser = async (username: string, isAdmin: boolean, data: any) => {
  const { password } = data

  const user = await User.findOne({ username })
  if (!user) throw new Error('Username is not found.')

  if (!isAdmin) {
    const validPass = await bcrypt.compare(password, user.password)
    if (!validPass) throw new Error('Invalid password.')
  }

  await User.deleteOne({ username })
}
