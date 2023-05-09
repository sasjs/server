import { PermissionResponse, RegisterPermissionPayload } from './types'

export const findExistingPermission = (
  existingPermissions: PermissionResponse[],
  newPermission: RegisterPermissionPayload
) => {
  for (const permission of existingPermissions) {
    if (
      permission.user?.uid === newPermission.principalId &&
      hasSameCombination(permission, newPermission)
    )
      return permission

    if (
      permission.group?.uid === newPermission.principalId &&
      hasSameCombination(permission, newPermission)
    )
      return permission
  }

  return null
}

export const findUpdatingPermission = (
  existingPermissions: PermissionResponse[],
  newPermission: RegisterPermissionPayload
) => {
  for (const permission of existingPermissions) {
    if (
      permission.user?.uid === newPermission.principalId &&
      hasDifferentSetting(permission, newPermission)
    )
      return permission

    if (
      permission.group?.uid === newPermission.principalId &&
      hasDifferentSetting(permission, newPermission)
    )
      return permission
  }

  return null
}

const hasSameCombination = (
  existingPermission: PermissionResponse,
  newPermission: RegisterPermissionPayload
) =>
  existingPermission.path === newPermission.path &&
  existingPermission.type === newPermission.type &&
  existingPermission.setting === newPermission.setting

const hasDifferentSetting = (
  existingPermission: PermissionResponse,
  newPermission: RegisterPermissionPayload
) =>
  existingPermission.path === newPermission.path &&
  existingPermission.type === newPermission.type &&
  existingPermission.setting !== newPermission.setting
