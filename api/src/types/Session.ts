export interface Session {
  id: string
  ready: boolean
  creationTimeStamp: string
  deathTimeStamp: string
  path: string
  inUse: boolean
  consumed: boolean
  completed: boolean
  crashed?: string
}
