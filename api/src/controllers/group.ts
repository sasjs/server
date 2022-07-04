import {
  Security,
  Route,
  Tags,
  Path,
  Example,
  Get,
  Post,
  Delete,
  Body
} from 'tsoa'

import Group, { GroupPayload } from '../model/Group'
import User from '../model/User'
import { UserResponse } from './user'

export interface GroupResponse {
  groupId: number
  name: string
  description: string
}

export interface GroupDetailsResponse {
  groupId: number
  name: string
  description: string
  isActive: boolean
  users: UserResponse[]
}

interface GetGroupBy {
  groupId?: number
  name?: string
}

@Security('bearerAuth')
@Route('SASjsApi/group')
@Tags('Group')
export class GroupController {
  /**
   * @summary Get list of all groups (groupName and groupDescription). All users can request this.
   *
   */
  @Example<GroupResponse[]>([
    {
      groupId: 123,
      name: 'DCGroup',
      description: 'This group represents Data Controller Users'
    }
  ])
  @Get('/')
  public async getAllGroups(): Promise<GroupResponse[]> {
    return getAllGroups()
  }

  /**
   * @summary Create a new group. Admin only.
   *
   */
  @Example<GroupDetailsResponse>({
    groupId: 123,
    name: 'DCGroup',
    description: 'This group represents Data Controller Users',
    isActive: true,
    users: []
  })
  @Post('/')
  public async createGroup(
    @Body() body: GroupPayload
  ): Promise<GroupDetailsResponse> {
    return createGroup(body)
  }

  /**
   * @summary Get list of members of a group (userName). All users can request this.
   * @param name The group's name
   * @example dcgroup
   */
  @Get('by/groupname/{name}')
  public async getGroupByGroupName(
    @Path() name: string
  ): Promise<GroupDetailsResponse> {
    return getGroup({ name })
  }

  /**
   * @summary Get list of members of a group (userName). All users can request this.
   * @param groupId The group's identifier
   * @example groupId 1234
   */
  @Get('{groupId}')
  public async getGroup(
    @Path() groupId: number
  ): Promise<GroupDetailsResponse> {
    return getGroup({ groupId })
  }

  /**
   * @summary Add a user to a group. Admin task only.
   * @param groupId The group's identifier
   * @example groupId "1234"
   * @param userId The user's identifier
   * @example userId "6789"
   */
  @Example<GroupDetailsResponse>({
    groupId: 123,
    name: 'DCGroup',
    description: 'This group represents Data Controller Users',
    isActive: true,
    users: []
  })
  @Post('{groupId}/{userId}')
  public async addUserToGroup(
    @Path() groupId: number,
    @Path() userId: number
  ): Promise<GroupDetailsResponse> {
    return addUserToGroup(groupId, userId)
  }

  /**
   * @summary Remove a user to a group. Admin task only.
   * @param groupId The group's identifier
   * @example groupId "1234"
   * @param userId The user's identifier
   * @example userId "6789"
   */
  @Example<GroupDetailsResponse>({
    groupId: 123,
    name: 'DCGroup',
    description: 'This group represents Data Controller Users',
    isActive: true,
    users: []
  })
  @Delete('{groupId}/{userId}')
  public async removeUserFromGroup(
    @Path() groupId: number,
    @Path() userId: number
  ): Promise<GroupDetailsResponse> {
    return removeUserFromGroup(groupId, userId)
  }

  /**
   * @summary Delete a group. Admin task only.
   * @param groupId The group's identifier
   * @example groupId 1234
   */
  @Delete('{groupId}')
  public async deleteGroup(@Path() groupId: number) {
    const group = await Group.findOne({ groupId })
    if (group) return await group.remove()
    throw {
      code: 404,
      status: 'Not Found',
      message: 'Group not found.'
    }
  }
}

const getAllGroups = async (): Promise<GroupResponse[]> =>
  await Group.find({})
    .select({ _id: 0, groupId: 1, name: 1, description: 1 })
    .exec()

const createGroup = async ({
  name,
  description,
  isActive
}: GroupPayload): Promise<GroupDetailsResponse> => {
  // Checking if user is already in the database
  const groupnameExist = await Group.findOne({ name })
  if (groupnameExist)
    throw {
      code: 409,
      status: 'Conflict',
      message: 'Group name already exists.'
    }

  const group = new Group({
    name,
    description,
    isActive
  })

  const savedGroup = await group.save()

  return {
    groupId: savedGroup.groupId,
    name: savedGroup.name,
    description: savedGroup.description,
    isActive: savedGroup.isActive,
    users: []
  }
}

const getGroup = async (findBy: GetGroupBy): Promise<GroupDetailsResponse> => {
  const group = (await Group.findOne(
    findBy,
    'groupId name description isActive users -_id'
  ).populate(
    'users',
    'id username displayName isAdmin -_id'
  )) as unknown as GroupDetailsResponse
  if (!group)
    throw {
      code: 404,
      status: 'Not Found',
      message: 'Group not found.'
    }

  return {
    groupId: group.groupId,
    name: group.name,
    description: group.description,
    isActive: group.isActive,
    users: group.users
  }
}

const addUserToGroup = async (
  groupId: number,
  userId: number
): Promise<GroupDetailsResponse> =>
  updateUsersListInGroup(groupId, userId, 'addUser')

const removeUserFromGroup = async (
  groupId: number,
  userId: number
): Promise<GroupDetailsResponse> =>
  updateUsersListInGroup(groupId, userId, 'removeUser')

const updateUsersListInGroup = async (
  groupId: number,
  userId: number,
  action: 'addUser' | 'removeUser'
): Promise<GroupDetailsResponse> => {
  const group = await Group.findOne({ groupId })
  if (!group)
    throw {
      code: 404,
      status: 'Not Found',
      message: 'Group not found.'
    }

  const user = await User.findOne({ id: userId })
  if (!user)
    throw {
      code: 404,
      status: 'Not Found',
      message: 'User not found.'
    }

  const updatedGroup =
    action === 'addUser'
      ? await group.addUser(user)
      : await group.removeUser(user)

  if (!updatedGroup)
    throw {
      code: 400,
      status: 'Bad Request',
      message: 'Unable to update group.'
    }

  return {
    groupId: updatedGroup.groupId,
    name: updatedGroup.name,
    description: updatedGroup.description,
    isActive: updatedGroup.isActive,
    users: updatedGroup.users
  }
}
