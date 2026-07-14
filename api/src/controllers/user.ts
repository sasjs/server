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
import {
  getUserAutoExec,
  updateUserAutoExec,
  ModeType,
  ALL_USERS_GROUP
} from '../utils'
import { GroupController, GroupResponse } from './group'

export interface UserResponse {
  id: number
  username: string
  displayName: string
  isAdmin: boolean
}

export interface UserDetailsResponse {
  id: number
  displayName: string
  username: string
  isActive: boolean
  isAdmin: boolean
  autoExec?: string
  groups?: GroupResponse[]
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
      displayName: 'John',
      isAdmin: false
    },
    {
      id: 456,
      username: 'starkusername',
      displayName: 'Stark',
      isAdmin: true
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
   * @param username The User's username
   * @example username "johnSnow01"
   */
  @Get('by/username/{username}')
  public async getUserByUsername(
    @Request() req: express.Request,
    @Path() username: string
  ): Promise<UserDetailsResponse> {
    const { MODE } = process.env

    if (MODE === ModeType.Desktop) return getDesktopAutoExec()

    const { user } = req
    const getAutoExec = user!.isAdmin || user!.username == username
    return getUser({ username }, getAutoExec)
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
    return getUser({ id: userId }, getAutoExec)
  }

  /**
   * @summary Update user properties - such as displayName. Can be performed either by admins, or the user in question.
   * @param username The User's username
   * @example username "johnSnow01"
   */
  @Example<UserDetailsResponse>({
    id: 1234,
    displayName: 'John Snow',
    username: 'johnSnow01',
    isAdmin: false,
    isActive: true
  })
  @Patch('by/username/{username}')
  public async updateUserByUsername(
    @Path() username: string,
    @Body() body: UserPayload
  ): Promise<UserDetailsResponse> {
    const { MODE } = process.env

    if (MODE === ModeType.Desktop)
      return updateDesktopAutoExec(body.autoExec ?? '')

    return updateUser({ username }, body)
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

    return updateUser({ id: userId }, body)
  }

  /**
   * @summary Delete a user. Can be performed either by admins, or the user in question.
   * @param username The User's username
   * @example username "johnSnow01"
   */
  @Delete('by/username/{username}')
  public async deleteUserByUsername(
    @Path() username: string,
    @Body() body: { password?: string },
    @Query() @Hidden() isAdmin: boolean = false
  ) {
    return deleteUser({ username }, isAdmin, body)
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
    return deleteUser({ id: userId }, isAdmin, body)
  }
}

const getAllUsers = async (): Promise<UserResponse[]> =>
  await User.find({})
    .select({ _id: 0, id: 1, username: 1, displayName: 1, isAdmin: 1 })
    .exec()

const createUser = async (data: UserPayload): Promise<UserDetailsResponse> => {
  const { displayName, username, password, isAdmin, isActive, autoExec } = data

  // Checking if user is already in the database
  const usernameExist = await User.findOne({ username })
  if (usernameExist)
    throw {
      code: 409,
      message: 'Username already exists.'
    }

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

  const groupController = new GroupController()
  const allUsersGroup = await groupController
    .getGroupByGroupName(ALL_USERS_GROUP.name)
    .catch(() => {})

  if (allUsersGroup) {
    await groupController.addUserToGroup(allUsersGroup.groupId, savedUser.id)
  }

  return {
    id: savedUser.id,
    displayName: savedUser.displayName,
    username: savedUser.username,
    isActive: savedUser.isActive,
    isAdmin: savedUser.isAdmin,
    autoExec: savedUser.autoExec
  }
}

interface GetUserBy {
  id?: number
  username?: string
}

const getUser = async (
  findBy: GetUserBy,
  getAutoExec: boolean
): Promise<UserDetailsResponse> => {
  const user = (await User.findOne(
    findBy,
    `id displayName username isActive isAdmin autoExec -_id`
  ).populate(
    'groups',
    'groupId name description -_id'
  )) as unknown as UserDetailsResponse

  if (!user)
    throw {
      code: 404,
      message: 'User is not found.'
    }

  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    isActive: user.isActive,
    isAdmin: user.isAdmin,
    autoExec: getAutoExec ? (user.autoExec ?? '') : undefined,
    groups: user.groups
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
  findBy: GetUserBy,
  data: Partial<UserPayload>
): Promise<UserDetailsResponse> => {
  const { displayName, username, password, isAdmin, isActive, autoExec } = data

  const params: any = { displayName, isAdmin, isActive, autoExec }

  const user = await User.findOne(findBy)

  if (username && username !== user?.username && user?.authProvider) {
    throw {
      code: 405,
      message:
        'Can not update username of user that is created by an external auth provider.'
    }
  }

  if (displayName && displayName !== user?.displayName && user?.authProvider) {
    throw {
      code: 405,
      message:
        'Can not update display name of user that is created by an external auth provider.'
    }
  }

  if (username) {
    // Checking if user is already in the database
    const usernameExist = await User.findOne({ username })
    if (usernameExist) {
      if (
        (findBy.id && usernameExist.id != findBy.id) ||
        (findBy.username && usernameExist.username != findBy.username)
      )
        throw {
          code: 409,
          message: 'Username already exists.'
        }
    }
    params.username = username
  }

  if (password) {
    // Hash passwords
    params.password = User.hashPassword(password)
  }

  const updatedUser = await User.findOneAndUpdate(findBy, params, { new: true })

  if (!updatedUser)
    throw {
      code: 404,
      message: `Unable to find user with ${findBy.id || findBy.username}`
    }

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
  findBy: GetUserBy,
  isAdmin: boolean,
  { password }: { password?: string }
) => {
  const user = await User.findOne(findBy)
  if (!user)
    throw {
      code: 404,
      message: 'User is not found.'
    }

  if (!isAdmin) {
    const validPass = user.comparePassword(password!)
    if (!validPass)
      throw {
        code: 401,
        message: 'Invalid password.'
      }
  }

  await User.deleteOne(findBy)
}
