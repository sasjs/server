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
  /**
   * The username the session belongs to, set when the session is created.
   *
   * A session id is not a secret - it is handed to the caller that triggered the
   * program, and it is built from a timestamp plus a small random number - so
   * the artifact endpoints check this before serving a log or a webout. Every
   * session has an owner: there is no unowned session to fall back on.
   */
  owner: string
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
  /**
   * The time the process behind `pid` started, as the OS reports it.
   *
   * A pid is only unique while its process lives, so on its own it cannot tell
   * this session's process from an unrelated one that reused the number. Recorded
   * when the process is spawned and compared before the shutdown waits on it or
   * signals it; absent where the platform does not expose it (`/proc` is Linux),
   * in which case the pid is the best identity there is.
   */
  pidStartedAt?: string
  /**
   * Set when the shutdown ended this session on purpose.
   *
   * The process then exits non-zero because it was signalled, and reporting that
   * as "session crashed" is exactly the misleading log line sasjs/server#162 is
   * about - so the exit handlers check this before they call it a crash.
   */
  terminatedByShutdown?: boolean
  expiresAfterMins?: { mins: number; used: boolean }
  failureReason?: string
}
