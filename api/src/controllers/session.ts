import express from 'express'
import path from 'path'
import {
  Request,
  Security,
  Route,
  Tags,
  Example,
  Get,
  Path,
  Produces
} from 'tsoa'
import { readFile } from 'fs/promises'
import { UserResponse } from './user'
import { getSessionController } from './internal'
import {
  Session,
  SessionState,
  SessionStateResponse,
  SessionSummary
} from '../types'
import { extractHeaders } from '../utils'

interface SessionResponse extends UserResponse {
  needsToUpdatePassword?: boolean
}

@Security('bearerAuth')
@Route('SASjsApi/session')
@Tags('Session')
export class SessionController {
  /**
   * Returns the properties of the authenticated user as held in the session:
   * their id, username, display name, whether they are an administrator, and
   * whether they still have to change their password.
   *
   * @summary Get the current session
   */
  @Example<SessionResponse>({
    uid: 'userIdString',
    username: 'johnusername',
    displayName: 'John',
    isAdmin: false,
    needsToUpdatePassword: false
  })
  @Get('/')
  public async session(
    @Request() request: express.Request
  ): Promise<SessionResponse> {
    return session(request)
  }

  /**
   * Returns the current state of a session created by `POST /SASjsApi/code/trigger`
   * or `POST /SASjsApi/stp/trigger`.
   *
   * The state is one of `initialising`, `pending`, `running`, `completed` or
   * `failed`. A `404` is returned when no session has that id.
   *
   * Polling is implemented for single-server deployments only; load-balanced and
   * grid topologies are not yet supported. If your site requires this, please
   * contact SASjs Support.
   *
   * @summary Get the state of a session
   */
  @Example<SessionStateResponse>({ state: SessionState.completed })
  @Get('/:sessionId/state')
  public async sessionState(
    @Request() request: express.Request,
    @Path() sessionId: string
  ): Promise<SessionStateResponse> {
    return { state: sessionState(sessionId, request) }
  }

  /**
   * Returns the session a triggered program is running in: its state, the OS
   * process id while it runs, when it was created and when it is due to be
   * destroyed, why it failed when that applies, and the retention window the
   * caller asked for.
   *
   * A `404` is returned when no session has that id, which is also what an
   * expired session answers: the folder is gone and nothing can be read.
   *
   * @summary Get a triggered session
   */
  @Example<SessionSummary>({
    sessionId: '20241028074744-54132-1730101664824',
    state: SessionState.completed,
    pid: 12345,
    creationTimeStamp: '1730101664824',
    deathTimeStamp: '1730102564823'
  })
  @Get('/:sessionId')
  public async sessionDetail(
    @Request() request: express.Request,
    @Path() sessionId: string
  ): Promise<SessionSummary> {
    const session = findSession(sessionId, request)

    return {
      sessionId: session.id,
      state: session.state,
      pid: session.pid,
      creationTimeStamp: session.creationTimeStamp,
      deathTimeStamp: session.deathTimeStamp,
      failureReason: session.failureReason,
      expiresAfterMins: session.expiresAfterMins
    }
  }

  /**
   * Returns the log of a triggered program as plain text.
   *
   * The same log the synchronous execute endpoints return in their response
   * body, which until now was the only way to obtain it: a caller that triggers
   * a program and polls for its state had no way to read what the program
   * printed.
   *
   * An empty body means the run has not written anything yet. A `404` means the
   * session is unknown or has been destroyed, so the log is no longer available.
   *
   * @summary Get the log of a triggered session
   */
  @Produces('text/plain')
  @Get('/:sessionId/log')
  public async sessionLog(
    @Request() request: express.Request,
    @Path() sessionId: string
  ): Promise<string> {
    const session = findSession(sessionId, request)

    return readArtifact(session, 'log.log')
  }

  /**
   * Returns the `_webout` of a triggered program, with the headers the program
   * set - the same bytes the synchronous execute endpoints answer with, so a
   * triggered run can be consumed exactly like a synchronous one.
   *
   * The content type comes from the session's `stpsrv_header.txt` and is passed
   * through the same header validation as the synchronous path, so a program
   * cannot inject response headers through its own output.
   *
   * A `404` means the session is unknown or has been destroyed. An empty body
   * means the program wrote no output.
   *
   * @summary Get the output of a triggered session
   */
  // The body can be JSON, HTML, CSV, plain text or a binary attachment,
  // depending on what the program wrote and the content type it set in
  // `stpsrv_header.txt`. OpenAPI can only declare one media type for a
  // response, and declaring `application/json` would invite a generated client
  // to parse an HTML table or a CSV as JSON, so the declaration is the opaque
  // one: read the `Content-Type` header of the response, which is the program's
  // own.
  @Produces('application/octet-stream')
  @Get('/:sessionId/output')
  public async sessionOutput(
    @Request() request: express.Request,
    @Path() sessionId: string
  ): Promise<string | Buffer> {
    const session = findSession(sessionId, request)

    const headersPath = path.join(session.path, 'stpsrv_header.txt')
    const headersFile = await readFile(headersPath)
      .then((content) => content.toString())
      .catch(() => '')

    const headers = extractHeaders(headersFile)
    ;(request as any).sasHeaders = headers
    request.res?.header(headers)

    const weboutPath = path.join(session.path, 'webout.txt')
    const webout = await readFile(weboutPath).catch(() => undefined)

    return webout ?? ''
  }
}

const session = (req: express.Request) => ({
  uid: req.user!.userId,
  username: req.user!.username,
  displayName: req.user!.displayName,
  isAdmin: req.user!.isAdmin,
  needsToUpdatePassword: req.user!.needsToUpdatePassword
})

/**
 * The session with this id, from whichever runtime is holding it.
 *
 * Sessions are kept per runtime, so a caller that only knows an id has to ask
 * each controller in turn. Not found is a `404` rather than an empty answer: an
 * expired session and one that never existed are the same thing to a caller -
 * there is nothing left to read.
 */
const findSession = (sessionId: string, request: express.Request): Session => {
  for (let runTime of process.runTimes) {
    // get session controller for each available runTime
    const sessionController = getSessionController(runTime)

    // get session by sessionId
    const session = sessionController.getSessionById(sessionId)

    if (!session) continue

    // A session id is not a secret: it is handed to the caller that triggered
    // the program and it is built from a timestamp plus a small random number,
    // so it is guessable within a window. The log and the webout are readable
    // by the session's owner and by an administrator; anyone else is told the
    // session does not exist, because confirming it does would say that the id
    // was right. There is no unowned session to fall back on.
    const { username, isAdmin } = request.user ?? {}

    if (session.owner !== username && !isAdmin) break

    return session
  }

  throw {
    code: 404,
    message: `Session with ID '${sessionId}' was not found.`
  }
}

const sessionState = (
  sessionId: string,
  request: express.Request
): SessionState => findSession(sessionId, request).state

/**
 * One of the files the execution writes into the session folder.
 *
 * A missing file is an empty string rather than an error: the session exists,
 * the run simply has not produced that artifact yet, and a poller should be able
 * to tell "nothing written" from "session gone" without inventing a status.
 */
const readArtifact = (session: Session, fileName: string): Promise<string> =>
  readFile(path.join(session.path, fileName))
    .then((content) => content.toString())
    .catch(() => '')
