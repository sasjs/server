export interface RequestUser {
  userId: number
  clientId: string
  username: string
  displayName: string
  isAdmin: boolean
  isActive: boolean
  needsToUpdatePassword: boolean
  autoExec?: string
}
