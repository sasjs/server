export interface UserResponse {
  id: number
  username: string
  displayName: string
  isAdmin: boolean
}

export interface GroupResponse {
  groupId: number
  name: string
  description: string
}

export interface GroupDetailsResponse extends GroupResponse {
  isActive: boolean
  users: UserResponse[]
}

export interface PermissionResponse {
  permissionId: number
  uri: string
  setting: string
  user?: UserResponse
  group?: GroupDetailsResponse
}

export interface RegisterPermissionPayload {
  uri: string
  setting: string
  principalType: string
  principalId: number
}
