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
  Body
} from 'tsoa'

import Permission from '../model/Permission'
import User from '../model/User'
import Group from '../model/Group'
import { UserResponse } from './user'
import { GroupResponse } from './group'

interface RegisterPermissionPayload {
  /**
   * Name of affected resource
   * @example "/SASjsApi/code/execute"
   */
  uri: string
  /**
   * The indication of whether (and to what extent) access is provided
   * @example "Grant"
   */
  setting: string
  /**
   * Indicates the type of principal
   * @example "user"
   */
  principalType: string
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
  setting: string
}

export interface PermissionDetailsResponse {
  permissionId: number
  uri: string
  setting: string
  user?: UserResponse
  group?: GroupResponse
}

@Security('bearerAuth')
@Route('SASjsApi/permission')
@Tags('Permission')
export class PermissionController {
  /**
   * @summary Get list of all permissions (uri, setting and userDetail).
   *
   */
  @Example<PermissionDetailsResponse[]>([
    {
      permissionId: 123,
      uri: '/SASjsApi/code/execute',
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
      uri: '/SASjsApi/code/execute',
      setting: 'Grant',
      group: {
        groupId: 1,
        name: 'DCGroup',
        description: 'This group represents Data Controller Users'
      }
    }
  ])
  @Get('/')
  public async getAllPermissions(): Promise<PermissionDetailsResponse[]> {
    return getAllPermissions()
  }

  /**
   * @summary Create a new permission. Admin only.
   *
   */
  @Example<PermissionDetailsResponse>({
    permissionId: 123,
    uri: '/SASjsApi/code/execute',
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
    uri: '/SASjsApi/code/execute',
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

const getAllPermissions = async (): Promise<PermissionDetailsResponse[]> =>
  (await Permission.find({})
    .select({
      _id: 0,
      permissionId: 1,
      uri: 1,
      setting: 1
    })
    .populate({ path: 'user', select: 'id username displayName isAdmin -_id' })
    .populate({
      path: 'group',
      select: 'groupId name description -_id'
    })) as unknown as PermissionDetailsResponse[]

const createPermission = async ({
  uri,
  setting,
  principalType,
  principalId
}: RegisterPermissionPayload): Promise<PermissionDetailsResponse> => {
  const permission = new Permission({
    uri,
    setting
  })

  let user: UserResponse | undefined
  let group: GroupResponse | undefined

  switch (principalType) {
    case 'user': {
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
        uri,
        user: userInDB._id
      })

      if (alreadyExists)
        throw {
          code: 409,
          status: 'Conflict',
          message: 'Permission already exists with provided URI and User.'
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
    case 'group': {
      const groupInDB = await Group.findOne({ groupId: principalId })
      if (!groupInDB)
        throw {
          code: 404,
          status: 'Not Found',
          message: 'Group not found.'
        }

      const alreadyExists = await Permission.findOne({
        uri,
        group: groupInDB._id
      })
      if (alreadyExists)
        throw {
          code: 409,
          status: 'Conflict',
          message: 'Permission already exists with provided URI and Group.'
        }

      permission.group = groupInDB._id

      group = {
        groupId: groupInDB.groupId,
        name: groupInDB.name,
        description: groupInDB.description
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
    uri: savedPermission.uri,
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
      uri: 1,
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
  const permission = await Permission.findOne({ id })
  if (!permission)
    throw {
      code: 404,
      status: 'Not Found',
      message: 'Permission not found.'
    }
  await Permission.deleteOne({ id })
}
