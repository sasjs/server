export enum SessionState {
  initialising = 'initialising', // session is initialising and nor ready to be used yet
  pending = 'pending', // session is ready to be used
  running = 'running', // session is in use
  completed = 'completed', // session is completed and can be destroyed
  failed = 'failed' // session failed
}
export interface Session {
  id: string
  state: SessionState
  creationTimeStamp: string
  deathTimeStamp: string
  path: string
  expiresAfterMins?: { mins: number; used: boolean }
  failureReason?: string
}
