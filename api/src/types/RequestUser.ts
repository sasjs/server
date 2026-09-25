export interface RequestUser {
  userId: string
  clientId: string
  username: string
  displayName: string
  isAdmin: boolean
  isActive: boolean
  needsToUpdatePassword: boolean
  autoExec?: string
}
