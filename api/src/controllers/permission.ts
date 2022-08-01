import express from 'express'
import {
  Security,
  Route,
  Tags,
  Path,
  Example,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Request
} from 'tsoa'

import Permission from '../model/Permission'
import User from '../model/User'
import Group from '../model/Group'
import { UserResponse } from './user'
import { GroupDetailsResponse } from './group'

export enum PermissionType {
  route = 'Route'
}

export enum PrincipalType {
  user = 'user',
  group = 'group'
}

export enum PermissionSettingForRoute {
  grant = 'Grant',
  deny = 'Deny'
}

interface RegisterPermissionPayload {
  /**
   * Name of affected resource
   * @example "/SASjsApi/code/execute"
   */
  path: string
  /**
   * Type of affected resource
   * @example "Route"
   */
  type: PermissionType
  /**
   * The indication of whether (and to what extent) access is provided
   * @example "Grant"
   */
  setting: PermissionSettingForRoute
  /**
   * Indicates the type of principal
   * @example "user"
   */
  principalType: PrincipalType
  /**
   * The id of user or group to which a rule is assigned.
   * @example 123
   */
  principalId: number
}

interface UpdatePermissionPayload {
  /**
   * The indication of whether (and to what extent) access is provided
   * @example "Grant"
   */
  setting: PermissionSettingForRoute
}

export interface PermissionDetailsResponse {
  permissionId: number
  path: string
  type: string
  setting: string
  user?: UserResponse
  group?: GroupDetailsResponse
}

@Security('bearerAuth')
@Route('SASjsApi/permission')
@Tags('Permission')
export class PermissionController {
  /**
   * Get the list of permission rules applicable the authenticated user.
   * If the user is an admin, all rules are returned.
   *
   * @summary Get the list of permission rules. If the user is admin, all rules are returned.
   *
   */
  @Example<PermissionDetailsResponse[]>([
    {
      permissionId: 123,
      path: '/SASjsApi/code/execute',
      type: 'Route',
      setting: 'Grant',
      user: {
        id: 1,
        username: 'johnSnow01',
        displayName: 'John Snow',
        isAdmin: false
      }
    },
    {
      permissionId: 124,
      path: '/SASjsApi/code/execute',
      type: 'Route',
      setting: 'Grant',
      group: {
        groupId: 1,
        name: 'DCGroup',
        description: 'This group represents Data Controller Users',
        isActive: true,
        users: []
      }
    }
  ])
  @Get('/')
  public async getAllPermissions(
    @Request() request: express.Request
  ): Promise<PermissionDetailsResponse[]> {
    return getAllPermissions(request)
  }

  /**
   * @summary Create a new permission. Admin only.
   *
   */
  @Example<PermissionDetailsResponse>({
    permissionId: 123,
    path: '/SASjsApi/code/execute',
    type: 'Route',
    setting: 'Grant',
    user: {
      id: 1,
      username: 'johnSnow01',
      displayName: 'John Snow',
      isAdmin: false
    }
  })
  @Post('/')
  public async createPermission(
    @Body() body: RegisterPermissionPayload
  ): Promise<PermissionDetailsResponse> {
    return createPermission(body)
  }

  /**
   * @summary Update permission setting. Admin only
   * @param permissionId The permission's identifier
   * @example permissionId 1234
   */
  @Example<PermissionDetailsResponse>({
    permissionId: 123,
    path: '/SASjsApi/code/execute',
    type: 'Route',
    setting: 'Grant',
    user: {
      id: 1,
      username: 'johnSnow01',
      displayName: 'John Snow',
      isAdmin: false
    }
  })
  @Patch('{permissionId}')
  public async updatePermission(
    @Path() permissionId: number,
    @Body() body: UpdatePermissionPayload
  ): Promise<PermissionDetailsResponse> {
    return updatePermission(permissionId, body)
  }

  /**
   * @summary Delete a permission. Admin only.
   * @param permissionId The user's identifier
   * @example permissionId 1234
   */
  @Delete('{permissionId}')
  public async deletePermission(@Path() permissionId: number) {
    return deletePermission(permissionId)
  }
}

const getAllPermissions = async (
  req: express.Request
): Promise<PermissionDetailsResponse[]> => {
  const { user } = req

  if (user?.isAdmin) return await Permission.get({})
  else {
    const permissions: PermissionDetailsResponse[] = []

    const dbUser = await User.findOne({ id: user?.userId })
    if (!dbUser)
      throw {
        code: 404,
        status: 'Not Found',
        message: 'User not found.'
      }

    permissions.push(...(await Permission.get({ user: dbUser._id })))

    for (const group of dbUser.groups) {
      permissions.push(...(await Permission.get({ group })))
    }

    return permissions
  }
}

const createPermission = async ({
  path,
  type,
  setting,
  principalType,
  principalId
}: RegisterPermissionPayload): Promise<PermissionDetailsResponse> => {
  const permission = new Permission({
    path,
    type,
    setting
  })

  let user: UserResponse | undefined
  let group: GroupDetailsResponse | undefined

  switch (principalType) {
    case PrincipalType.user: {
      const userInDB = await User.findOne({ id: principalId })
      if (!userInDB)
        throw {
          code: 404,
          status: 'Not Found',
          message: 'User not found.'
        }

      if (userInDB.isAdmin)
        throw {
          code: 400,
          status: 'Bad Request',
          message: 'Can not add permission for admin user.'
        }

      const alreadyExists = await Permission.findOne({
        path,
        type,
        user: userInDB._id
      })

      if (alreadyExists)
        throw {
          code: 409,
          status: 'Conflict',
          message:
            'Permission already exists with provided Path, Type and User.'
        }

      permission.user = userInDB._id

      user = {
        id: userInDB.id,
        username: userInDB.username,
        displayName: userInDB.displayName,
        isAdmin: userInDB.isAdmin
      }
      break
    }
    case PrincipalType.group: {
      const groupInDB = await Group.findOne({ groupId: principalId })
      if (!groupInDB)
        throw {
          code: 404,
          status: 'Not Found',
          message: 'Group not found.'
        }

      const alreadyExists = await Permission.findOne({
        path,
        type,
        group: groupInDB._id
      })
      if (alreadyExists)
        throw {
          code: 409,
          status: 'Conflict',
          message:
            'Permission already exists with provided Path, Type and Group.'
        }

      permission.group = groupInDB._id

      group = {
        groupId: groupInDB.groupId,
        name: groupInDB.name,
        description: groupInDB.description,
        isActive: groupInDB.isActive,
        users: groupInDB.populate({
          path: 'users',
          select: 'id username displayName isAdmin -_id',
          options: { limit: 15 }
        }) as unknown as UserResponse[]
      }
      break
    }
    default:
      throw {
        code: 400,
        status: 'Bad Request',
        message: 'Invalid principal type. Valid types are user or group.'
      }
  }

  const savedPermission = await permission.save()

  return {
    permissionId: savedPermission.permissionId,
    path: savedPermission.path,
    type: savedPermission.type,
    setting: savedPermission.setting,
    user,
    group
  }
}

const updatePermission = async (
  id: number,
  data: UpdatePermissionPayload
): Promise<PermissionDetailsResponse> => {
  const { setting } = data

  const updatedPermission = (await Permission.findOneAndUpdate(
    { permissionId: id },
    { setting },
    { new: true }
  )
    .select({
      _id: 0,
      permissionId: 1,
      path: 1,
      type: 1,
      setting: 1
    })
    .populate({ path: 'user', select: 'id username displayName isAdmin -_id' })
    .populate({
      path: 'group',
      select: 'groupId name description -_id'
    })) as unknown as PermissionDetailsResponse
  if (!updatedPermission)
    throw {
      code: 404,
      status: 'Not Found',
      message: 'Permission not found.'
    }

  return updatedPermission
}

const deletePermission = async (id: number) => {
  const permission = await Permission.findOne({ permissionId: id })
  if (!permission)
    throw {
      code: 404,
      status: 'Not Found',
      message: 'Permission not found.'
    }
  await Permission.deleteOne({ permissionId: id })
}
