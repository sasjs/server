export enum SessionState {
  initialising = 'initialising', // session is initialising and not ready to be used yet
  pending = 'pending', // session is ready to be used
  running = 'running', // session is in use
  completed = 'completed', // session is completed and can be destroyed
  failed = 'failed' // session failed
}
/**
 * Response of `GET /SASjsApi/session/{sessionId}/state`.
 *
 * An object rather than the bare enum, so the shape matches the compute API a
 * Viya caller already polls (`{ state: 'running' }`) and a client can be written
 * once for both servers.
 */
export interface SessionStateResponse {
  state: SessionState
}

/**
 * Response of `GET /SASjsApi/session/{sessionId}`.
 *
 * `path` is deliberately absent: the session folder is a server filesystem
 * location, and the artifacts a caller wants from it are served by the `log`
 * and `output` endpoints instead.
 */
export interface SessionSummary {
  sessionId: string
  state: SessionState
  pid?: number
  creationTimeStamp: string
  deathTimeStamp: string
  failureReason?: string
  expiresAfterMins?: { mins: number; used: boolean }
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
