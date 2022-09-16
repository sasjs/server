import { PermissionResponse } from '../../../utils/types'
import { PrincipalType } from './hooks/usePermission'
import DisplayGroup from './components/displayGroup'

export const displayPrincipal = (permission: PermissionResponse) => {
  if (permission.user) return permission.user.username
  if (permission.group) return <DisplayGroup group={permission.group} />
}

export const displayPrincipalType = (permission: PermissionResponse) => {
  if (permission.user) return PrincipalType.User
  if (permission.group) return PrincipalType.Group
}
