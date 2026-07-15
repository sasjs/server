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
   * @example 'groupIdString'
   */
  principalId: string
}

interface UpdatePermissionPayload {
  /**
   * The indication of whether (and to what extent) access is provided
   * @example "Grant"
   */
  setting: PermissionSettingForRoute
}

export interface PermissionDetailsResponse {
  uid: string
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
      uid: 'permissionId1String',
      path: '/SASjsApi/code/execute',
      type: 'Route',
      setting: 'Grant',
      user: {
        uid: 'user1-id',
        username: 'johnSnow01',
        displayName: 'John Snow',
        isAdmin: false
      }
    },
    {
      uid: 'permissionId2String',
      path: '/SASjsApi/code/execute',
      type: 'Route',
      setting: 'Grant',
      group: {
        uid: 'group1-id',
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
    uid: 'permissionIdString',
    path: '/SASjsApi/code/execute',
    type: 'Route',
    setting: 'Grant',
    user: {
      uid: 'userIdString',
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
   * @example permissionId "permissionIdString"
   */
  @Example<PermissionDetailsResponse>({
    uid: 'permissionIdString',
    path: '/SASjsApi/code/execute',
    type: 'Route',
    setting: 'Grant',
    user: {
      uid: 'userIdString',
      username: 'johnSnow01',
      displayName: 'John Snow',
      isAdmin: false
    }
  })
  @Patch('{uid}')
  public async updatePermission(
    @Path() uid: string,
    @Body() body: UpdatePermissionPayload
  ): Promise<PermissionDetailsResponse> {
    return updatePermission(uid, body)
  }

  /**
   * @summary Delete a permission. Admin only.
   * @param permissionId The user's identifier
   * @example permissionId "permissionIdString"
   */
  @Delete('{uid}')
  public async deletePermission(@Path() uid: string) {
    return deletePermission(uid)
  }
}

const getAllPermissions = async (
  req: express.Request
): Promise<PermissionDetailsResponse[]> => {
  const { user } = req

  if (user?.isAdmin) return await Permission.get({})
  else {
    const permissions: PermissionDetailsResponse[] = []

    const dbUser = await User.findOne({ _id: user?.userId })
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
      const userInDB = await User.findOne({ _id: principalId })
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
        uid: userInDB.uid,
        username: userInDB.username,
        displayName: userInDB.displayName,
        isAdmin: userInDB.isAdmin
      }
      break
    }
    case PrincipalType.group: {
      const groupInDB = await Group.findOne({ _id: principalId })
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
        uid: groupInDB.uid,
        name: groupInDB.name,
        description: groupInDB.description,
        isActive: groupInDB.isActive,
        users: groupInDB.populate({
          path: 'users',
          select: 'uid username displayName isAdmin -_id',
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
    uid: savedPermission.uid,
    path: savedPermission.path,
    type: savedPermission.type,
    setting: savedPermission.setting,
    user,
    group
  }
}

const updatePermission = async (
  uid: string,
  data: UpdatePermissionPayload
): Promise<PermissionDetailsResponse> => {
  const { setting } = data

  const updatedPermission = (await Permission.findOneAndUpdate(
    { _id: uid },
    { setting },
    { new: true }
  )
    .select('uid path type setting')
    .populate({ path: 'user', select: 'uid username displayName isAdmin' })
    .populate({
      path: 'group',
      select: 'groupId name description'
    })) as unknown as PermissionDetailsResponse
  if (!updatedPermission)
    throw {
      code: 404,
      status: 'Not Found',
      message: 'Permission not found.'
    }

  return updatedPermission
}

const deletePermission = async (uid: string) => {
  const permission = await Permission.findOne({ _id: uid })
  if (!permission)
    throw {
      code: 404,
      status: 'Not Found',
      message: 'Permission not found.'
    }
  await Permission.deleteOne({ _id: uid })
}
