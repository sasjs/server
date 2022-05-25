export interface RequestUser {
  userId: number
  clientId: string
  username: string
  displayName: string
  isAdmin: boolean
  isActive: boolean
  autoExec?: string
}
