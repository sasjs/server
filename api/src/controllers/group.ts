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
   * @summary Get list of all groups (groupName and groupDescription). All users can request this.
   *
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
   * @summary Create a new group. Admin only.
   *
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
   * @summary Get list of members of a group (userName). All users can request this.
   * @param name The group's name
   * @example dcgroup
   */
  @Get('by/groupname/{name}')
  public async getGroupByName(
    @Path() name: string
  ): Promise<GroupDetailsResponse> {
    return getGroup({ name })
  }

  /**
   * @summary Get list of members of a group (userName). All users can request this.
   * @param uid The group's identifier
   * @example uid "12ByteString"
   */
  @Get('{uid}')
  public async getGroup(@Path() uid: string): Promise<GroupDetailsResponse> {
    return getGroup({ _id: uid })
  }

  /**
   * @summary Add a user to a group. Admin task only.
   * @param groupUid The group's identifier
   * @example groupUid "12ByteString"
   * @param userUid The user's identifier
   * @example userId "12ByteString"
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
   * @summary Remove a user from a group. Admin task only.
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
   * @summary Delete a group. Admin task only.
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

    return await group.remove()
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
    users: updatedGroup.users
  }
}
