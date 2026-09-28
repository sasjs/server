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

import Group, { GroupPayload, PUBLIC_GROUP_NAME } from '../model/Group'
import User from '../model/User'
import { GetUserBy, UserResponse } from './user'

export interface GroupResponse {
  uid: string
  name: string
  description: string
}

export interface GroupDetailsResponse extends GroupResponse {
  isActive: boolean
  users: UserResponse[]
}

interface GetGroupBy {
  _id?: string
  name?: string
}

enum GroupAction {
  AddUser = 'addUser',
  RemoveUser = 'removeUser'
}

@Security('bearerAuth')
@Route('SASjsApi/group')
@Tags('Group')
export class GroupController {
  /**
   * Returns every group with its name and description.
   *
   * Available to any authenticated user.
   *
   * @summary List all groups
   */
  @Example<GroupResponse[]>([
    {
      uid: 'groupIdString',
      name: 'DCGroup',
      description: 'This group represents Data Controller Users'
    }
  ])
  @Get('/')
  public async getAllGroups(): Promise<GroupResponse[]> {
    return getAllGroups()
  }

  /**
   * Creates a new group. A `409` is returned when a group of that name already
   * exists. Admin only.
   *
   * @summary Create a group
   */
  @Example<GroupDetailsResponse>({
    uid: 'groupIdString',
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
   * Returns a group and its members, looked up by name.
   *
   * Available to any authenticated user. A `404` is returned when no group has
   * that name.
   *
   * @summary Get a group by name
   * @param name The group's name
   * @example name "dcgroup"
   */
  @Get('by/groupname/{name}')
  public async getGroupByName(
    @Path() name: string
  ): Promise<GroupDetailsResponse> {
    return getGroup({ name })
  }

  /**
   * Returns a group and its members, looked up by identifier.
   *
   * Available to any authenticated user. A `404` is returned when no group has
   * that identifier.
   *
   * @summary Get a group by id
   * @param uid The group's identifier
   * @example uid "12ByteString"
   */
  @Get('{uid}')
  public async getGroup(@Path() uid: string): Promise<GroupDetailsResponse> {
    return getGroup({ _id: uid })
  }

  /**
   * Adds a user to a group and returns the updated group.
   *
   * Admin only. Refused with `400` for the reserved `public` group and with
   * `405` when the group or the user is managed by an external auth provider.
   *
   * @summary Add a user to a group
   * @param groupUid The group's identifier
   * @example groupUid "12ByteString"
   * @param userUid The user's identifier
   * @example userUid "12ByteString"
   */
  @Example<GroupDetailsResponse>({
    uid: 'groupIdString',
    name: 'DCGroup',
    description: 'This group represents Data Controller Users',
    isActive: true,
    users: []
  })
  @Post('{groupUid}/{userUid}')
  public async addUserToGroup(
    @Path() groupUid: string,
    @Path() userUid: string
  ): Promise<GroupDetailsResponse> {
    return addUserToGroup(groupUid, userUid)
  }

  /**
   * Removes a user from a group and returns the updated group.
   *
   * Admin only. Refused with `400` for the reserved `public` group and with
   * `405` when the group or the user is managed by an external auth provider.
   *
   * @summary Remove a user from a group
   * @param groupUid The group's identifier
   * @example groupUid "12ByteString"
   * @param userUid The user's identifier
   * @example userUid "12ByteString"
   */
  @Example<GroupDetailsResponse>({
    uid: 'groupIdString',
    name: 'DCGroup',
    description: 'This group represents Data Controller Users',
    isActive: true,
    users: []
  })
  @Delete('{groupUid}/{userUid}')
  public async removeUserFromGroup(
    @Path() groupUid: string,
    @Path() userUid: string
  ): Promise<GroupDetailsResponse> {
    return removeUserFromGroup(groupUid, userUid)
  }

  /**
   * Deletes a group. Admin only. A `404` is returned when no group has that
   * identifier.
   *
   * @summary Delete a group
   * @param uid The group's identifier
   * @example uid "12ByteString"
   */
  @Delete('{uid}')
  public async deleteGroup(@Path() uid: string) {
    const group = await Group.findOne({ _id: uid })
    if (!group)
      throw {
        code: 404,
        status: 'Not Found',
        message: 'Group not found.'
      }

    return await group.deleteOne()
  }
}

const getAllGroups = async (): Promise<GroupResponse[]> =>
  await Group.find({}).select('uid name description').exec()

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
    uid: savedGroup.uid,
    name: savedGroup.name,
    description: savedGroup.description,
    isActive: savedGroup.isActive,
    users: []
  }
}

const getGroup = async (findBy: GetGroupBy): Promise<GroupDetailsResponse> => {
  const group = (await Group.findOne(
    findBy,
    'uid name description isActive users'
  ).populate(
    'users',
    'uid username displayName isAdmin'
  )) as unknown as GroupDetailsResponse

  if (!group)
    throw {
      code: 404,
      status: 'Not Found',
      message: 'Group not found.'
    }

  return {
    uid: group.uid,
    name: group.name,
    description: group.description,
    isActive: group.isActive,
    users: group.users
  }
}

const addUserToGroup = async (
  groupUid: string,
  userUid: string
): Promise<GroupDetailsResponse> =>
  updateUsersListInGroup(groupUid, userUid, GroupAction.AddUser)

const removeUserFromGroup = async (
  groupUid: string,
  userUid: string
): Promise<GroupDetailsResponse> =>
  updateUsersListInGroup(groupUid, userUid, GroupAction.RemoveUser)

const updateUsersListInGroup = async (
  groupUid: string,
  userUid: string,
  action: GroupAction
): Promise<GroupDetailsResponse> => {
  const group = await Group.findOne({ _id: groupUid })
  if (!group)
    throw {
      code: 404,
      status: 'Not Found',
      message: 'Group not found.'
    }

  if (group.name === PUBLIC_GROUP_NAME)
    throw {
      code: 400,
      status: 'Bad Request',
      message: `Can't add/remove user to '${PUBLIC_GROUP_NAME}' group.`
    }

  if (group.authProvider)
    throw {
      code: 405,
      status: 'Method Not Allowed',
      message: `Can't add/remove user to group created by external auth provider.`
    }

  const user = await User.findOne({ _id: userUid })
  if (!user)
    throw {
      code: 404,
      status: 'Not Found',
      message: 'User not found.'
    }

  if (user.authProvider)
    throw {
      code: 405,
      status: 'Method Not Allowed',
      message: `Can't add/remove user to group created by external auth provider.`
    }

  const updatedGroup =
    action === GroupAction.AddUser
      ? await group.addUser(user)
      : await group.removeUser(user)

  if (!updatedGroup)
    throw {
      code: 400,
      status: 'Bad Request',
      message: 'Unable to update group.'
    }

  return {
    uid: updatedGroup.uid,
    name: updatedGroup.name,
    description: updatedGroup.description,
    isActive: updatedGroup.isActive,
    users: updatedGroup.users as unknown as UserResponse[]
  }
}
