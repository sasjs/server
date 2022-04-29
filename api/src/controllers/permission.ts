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
import Client from '../model/Client'
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
   * The id of user(number), group(name), or client(clientId) to which a rule is assigned.
   * @example 123
   */
  principalId: any
}

interface UpdatePermissionPayload {
  /**
   * The indication of whether (and to what extent) access is provided
   * @example "Grant"
   */
  setting: string
}

interface PermissionDetailsResponse {
  permissionId: number
  uri: string
  setting: string
  user?: UserResponse
  group?: GroupResponse
  clientId?: string
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
      user: { id: 1, username: 'johnSnow01', displayName: 'John Snow' }
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
    },
    {
      permissionId: 125,
      uri: '/SASjsApi/code/execute',
      setting: 'Deny',
      clientId: 'clientId1'
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
    user: { id: 1, username: 'johnSnow01', displayName: 'John Snow' }
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
    user: { id: 1, username: 'johnSnow01', displayName: 'John Snow' }
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
    .populate({ path: 'user', select: 'id username displayName -_id' })
    .populate({
      path: 'group',
      select: 'groupId name description -_id'
    })
    .populate({
      path: 'client',
      select: 'clientId -_id'
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
  let clientId: string | undefined

  switch (principalType) {
    case 'user':
      const userInDB = await User.findOne({ id: principalId })
      if (!userInDB) throw new Error('User not found.')

      permission.user = userInDB._id

      user = {
        id: userInDB.id,
        username: userInDB.username,
        displayName: userInDB.displayName
      }
      break
    case 'group':
      const groupInDB = await Group.findOne({ groupId: principalId })
      if (!groupInDB) throw new Error('Group not found.')

      permission.group = groupInDB._id

      group = {
        groupId: groupInDB.groupId,
        name: groupInDB.name,
        description: groupInDB.description
      }
      break
    case 'client':
      const clientInDB = await Client.findOne({ clientId: principalId })
      if (!clientInDB) throw new Error('Client not found.')

      permission.client = clientInDB._id

      clientId = clientInDB.clientId
      break
    default:
      throw new Error('Invalid principal type.')
  }

  const savedPermission = await permission.save()

  return {
    permissionId: savedPermission.permissionId,
    uri: savedPermission.uri,
    setting: savedPermission.setting,
    user,
    group,
    clientId
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
    .populate({ path: 'user', select: 'id username displayName -_id' })
    .populate({
      path: 'group',
      select: 'groupId name description -_id'
    })
    .populate({
      path: 'client',
      select: 'clientId -_id'
    })) as unknown as PermissionDetailsResponse
  if (!updatedPermission) throw new Error('Unable to update permission')

  return updatedPermission
}

const deletePermission = async (id: number) => {
  const permission = await Permission.findOne({ id })
  if (!permission) throw new Error('Permission is not found.')
  await Permission.deleteOne({ id })
}
