import { Request } from 'express'
import { getPath } from './getAuthorizedRoutes'
import Group, { PUBLIC_GROUP_NAME } from '../model/Group'
import Permission from '../model/Permission'
import { PermissionSettingForRoute } from '../controllers'
import { RequestUser } from '../types'

export const isPublicRoute = async (req: Request): Promise<boolean> => {
  const group = await Group.findOne({ name: PUBLIC_GROUP_NAME })
  if (group) {
    const path = getPath(req)

    const groupPermission = await Permission.findOne({
      path,
      group: group?._id
    })
    if (groupPermission?.setting === PermissionSettingForRoute.grant)
      return true
  }

  return false
}

export const publicUser: RequestUser = {
  userId: 0,
  clientId: 'public_app',
  username: 'publicUser',
  displayName: 'Public User',
  isAdmin: false,
  isActive: true,
  needsToUpdatePassword: false
}
