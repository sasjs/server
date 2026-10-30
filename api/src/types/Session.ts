export enum SessionState {
  initialising = 'initialising', // session is initialising and not ready to be used yet
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
  /**
   * OS process id of the process running this session: the SAS binary for the
   * `sas` runtime, or the interpreter for `js`/`py`/`r`.
   *
   * Absent on `sasviya`, where the program runs on the Viya server rather than
   * locally, and before the process is spawned.
   */
  pid?: number
  expiresAfterMins?: { mins: number; used: boolean }
  failureReason?: string
}
