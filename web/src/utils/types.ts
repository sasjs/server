export interface UserResponse {
  id: number
  username: string
  displayName: string
}

export interface GroupResponse {
  groupId: number
  name: string
  description: string
}

export interface PermissionResponse {
  permissionId: number
  uri: string
  setting: string
  user?: UserResponse
  group?: GroupResponse
}

export interface RegisterPermissionPayload {
  uri: string
  setting: string
  principalType: string
  principalId: number
}
