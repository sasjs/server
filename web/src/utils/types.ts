export interface UserResponse {
  uid: string
  username: string
  displayName: string
  isAdmin: boolean
}

export interface GroupResponse {
  uid: string
  name: string
  description: string
}

export interface GroupDetailsResponse extends GroupResponse {
  isActive: boolean
  users: UserResponse[]
}

export interface PermissionResponse {
  uid: string
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
  principalId: string
}

export interface TreeNode {
  name: string
  relativePath: string
  isFolder: boolean
  children: Array<TreeNode>
  /** When the file was last written, ISO, from the server's filesystem. */
  modified?: string
  /** When the file was created, ISO. Folders carry neither date. */
  created?: string
  /** Reported by the API for one-level loads: this folder is not empty. */
  hasChildren?: boolean
  /** Set once this node's children have been fetched, so [] means "empty". */
  childrenLoaded?: boolean
}

export interface LogInstance {
  body: string
  line: number
  /** The line the message ended on, which differs from `line` when SAS wrapped it. */
  endLine: number
  /** SAS's own message identifier, e.g. `22-322`, where the message carries one. */
  code?: string
  type: 'error' | 'warning' | 'note'
  id: number
  ref?: any
}

export interface LogObject {
  body: string
  errors?: LogInstance[]
  warnings?: LogInstance[]
  /** The notable notes, which the reader can list or leave out. */
  notes?: LogInstance[]
  linesCount: number
}
