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
  Hidden,
  Security
} from 'tsoa'
import bcrypt from 'bcryptjs'

import User, { UserPayload } from '../model/User'

interface userResponse {
  id: number
  username: string
  displayName: string
}

interface userDetailsResponse {
  id: number
  displayName: string
  username: string
  isActive: boolean
  isAdmin: boolean
}

@Security('bearerAuth')
@Route('SASjsApi/user')
export default class UserController {
  /**
   * Get list of all users (username, displayname). All users can request this.
   *
   */
  @Example<userResponse[]>([
    {
      id: 123,
      username: 'johnusername',
      displayName: 'John'
    },
    {
      id: 456,
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
    id: 1234,
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
   * Get user properties - such as group memberships, userName, displayName.
   * @param userId The user's identifier
   * @example userId 1234
   */
  @Get('{userId}')
  public async getUser(@Path() userId: number): Promise<userDetailsResponse> {
    return getUser(userId)
  }

  /**
   * Update user properties - such as displayName. Can be performed either by admins, or the user in question.
   * @param userId The user's identifier
   * @example userId "1234"
   */
  @Example<userDetailsResponse>({
    id: 1234,
    displayName: 'John Snow',
    username: 'johnSnow01',
    isAdmin: false,
    isActive: true
  })
  @Patch('{userId}')
  public async updateUser(
    @Path() userId: number,
    @Body() body: UserPayload
  ): Promise<userDetailsResponse> {
    return updateUser(userId, body)
  }

  /**
   * Delete a user. Can be performed either by admins, or the user in question.
   * @param userId The user's identifier
   * @example userId 1234
   */
  @Delete('{userId}')
  public async deleteUser(
    @Path() userId: number,
    @Body() body: { password?: string },
    @Query() @Hidden() isAdmin: boolean = false
  ) {
    return deleteUser(userId, isAdmin, body)
  }
}

const getAllUsers = async (): Promise<userResponse[]> =>
  await User.find({})
    .select({ _id: 0, id: 1, username: 1, displayName: 1 })
    .exec()

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

  return savedUser
}

const getUser = async (id: number) => {
  const user = await User.findOne({ id })
    .select({
      _id: 0,
      id: 1,
      username: 1,
      displayName: 1,
      isAdmin: 1,
      isActive: 1
    })
    .exec()
  if (!user) throw new Error('User is not found.')

  return user
}

const updateUser = async (id: number, data: any) => {
  const { displayName, username, password, isAdmin, isActive } = data

  const params: any = { displayName, username, isAdmin, isActive }

  if (password) {
    // Hash passwords
    const salt = await bcrypt.genSalt(10)
    params.password = await bcrypt.hash(password, salt)
  }

  const updatedUser = await User.findOneAndUpdate({ id }, params, { new: true })
    .select({
      _id: 0,
      id: 1,
      username: 1,
      displayName: 1,
      isAdmin: 1,
      isActive: 1
    })
    .exec()
  if (!updatedUser) throw new Error('Unable to update user')

  return updatedUser
}

const deleteUser = async (id: number, isAdmin: boolean, data: any) => {
  const { password } = data

  const user = await User.findOne({ id })
  if (!user) throw new Error('User is not found.')

  if (!isAdmin) {
    const validPass = await bcrypt.compare(password, user.password)
    if (!validPass) throw new Error('Invalid password.')
  }

  await User.deleteOne({ id })
}
