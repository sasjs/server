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
  path: string
  type: string
  setting: string
  user?: UserResponse
  group?: GroupDetailsResponse
}

export interface RegisterPermissionPayload {
  path: string
  type: string
  setting: string
  principalType: string
  principalId: number
}

export interface TreeNode {
  name: string
  relativePath: string
  isFolder: boolean
  children: Array<TreeNode>
}

export interface LogInstance {
  body: string
  line: number
  type: 'error' | 'warning'
  id: number
  ref?: any
}

export interface LogObject {
  body: string
  errors?: LogInstance[]
  warnings?: LogInstance[]
  linesCount: number
}
