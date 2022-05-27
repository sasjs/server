import express from 'express'
import {
  Security,
  Route,
  Tags,
  Path,
  Query,
  Example,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Hidden,
  Request
} from 'tsoa'
import { desktopUser } from '../middlewares'

import User, { UserPayload } from '../model/User'
import { getUserAutoExec, updateUserAutoExec, ModeType } from '../utils'

export interface UserResponse {
  id: number
  username: string
  displayName: string
}

interface UserDetailsResponse {
  id: number
  displayName: string
  username: string
  isActive: boolean
  isAdmin: boolean
  autoExec?: string
}

@Security('bearerAuth')
@Route('SASjsApi/user')
@Tags('User')
export class UserController {
  /**
   * @summary Get list of all users (username, displayname). All users can request this.
   *
   */
  @Example<UserResponse[]>([
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
  public async getAllUsers(): Promise<UserResponse[]> {
    return getAllUsers()
  }

  /**
   * @summary Create user with the following attributes: UserId, UserName, Password, isAdmin, isActive. Admin only task.
   *
   */
  @Example<UserDetailsResponse>({
    id: 1234,
    displayName: 'John Snow',
    username: 'johnSnow01',
    isAdmin: false,
    isActive: true
  })
  @Post('/')
  public async createUser(
    @Body() body: UserPayload
  ): Promise<UserDetailsResponse> {
    return createUser(body)
  }

  /**
   * Only Admin or user itself will get user autoExec code.
   * @summary Get user properties - such as group memberships, userName, displayName.
   * @param userId The user's identifier
   * @example userId 1234
   */
  @Get('{userId}')
  public async getUser(
    @Request() req: express.Request,
    @Path() userId: number
  ): Promise<UserDetailsResponse> {
    const { MODE } = process.env

    if (MODE === ModeType.Desktop) return getDesktopAutoExec()

    const { user } = req
    const getAutoExec = user!.isAdmin || user!.userId == userId
    return getUser(userId, getAutoExec)
  }

  /**
   * @summary Update user properties - such as displayName. Can be performed either by admins, or the user in question.
   * @param userId The user's identifier
   * @example userId "1234"
   */
  @Example<UserDetailsResponse>({
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
  ): Promise<UserDetailsResponse> {
    const { MODE } = process.env

    if (MODE === ModeType.Desktop)
      return updateDesktopAutoExec(body.autoExec ?? '')

    return updateUser(userId, body)
  }

  /**
   * @summary Delete a user. Can be performed either by admins, or the user in question.
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

const getAllUsers = async (): Promise<UserResponse[]> =>
  await User.find({})
    .select({ _id: 0, id: 1, username: 1, displayName: 1 })
    .exec()

const createUser = async (data: UserPayload): Promise<UserDetailsResponse> => {
  const { displayName, username, password, isAdmin, isActive, autoExec } = data

  // Checking if user is already in the database
  const usernameExist = await User.findOne({ username })
  if (usernameExist) throw new Error('Username already exists.')

  // Hash passwords
  const hashPassword = User.hashPassword(password)

  // Create a new user
  const user = new User({
    displayName,
    username,
    password: hashPassword,
    isAdmin,
    isActive,
    autoExec
  })

  const savedUser = await user.save()

  return {
    id: savedUser.id,
    displayName: savedUser.displayName,
    username: savedUser.username,
    isActive: savedUser.isActive,
    isAdmin: savedUser.isAdmin,
    autoExec: savedUser.autoExec
  }
}

const getUser = async (
  id: number,
  getAutoExec: boolean
): Promise<UserDetailsResponse> => {
  const user = await User.findOne({ id })

  if (!user) throw new Error('User is not found.')

  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    isActive: user.isActive,
    isAdmin: user.isAdmin,
    autoExec: getAutoExec ? user.autoExec ?? '' : undefined
  }
}

const getDesktopAutoExec = async () => {
  return {
    ...desktopUser,
    id: desktopUser.userId,
    autoExec: await getUserAutoExec()
  }
}

const updateUser = async (
  id: number,
  data: Partial<UserPayload>
): Promise<UserDetailsResponse> => {
  const { displayName, username, password, isAdmin, isActive, autoExec } = data

  const params: any = { displayName, isAdmin, isActive, autoExec }

  if (username) {
    // Checking if user is already in the database
    const usernameExist = await User.findOne({ username })
    if (usernameExist && usernameExist.id != id)
      throw new Error('Username already exists.')
    params.username = username
  }

  if (password) {
    // Hash passwords
    params.password = User.hashPassword(password)
  }

  const updatedUser = await User.findOneAndUpdate({ id }, params, { new: true })

  if (!updatedUser) throw new Error(`Unable to find user with id: ${id}`)

  return {
    id: updatedUser.id,
    username: updatedUser.username,
    displayName: updatedUser.displayName,
    isAdmin: updatedUser.isAdmin,
    isActive: updatedUser.isActive,
    autoExec: updatedUser.autoExec
  }
}

const updateDesktopAutoExec = async (autoExec: string) => {
  await updateUserAutoExec(autoExec)
  return {
    ...desktopUser,
    id: desktopUser.userId,
    autoExec
  }
}

const deleteUser = async (
  id: number,
  isAdmin: boolean,
  { password }: { password?: string }
) => {
  const user = await User.findOne({ id })
  if (!user) throw new Error('User is not found.')

  if (!isAdmin) {
    const validPass = user.comparePassword(password!)
    if (!validPass) throw new Error('Invalid password.')
  }

  await User.deleteOne({ id })
}
