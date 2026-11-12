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
  Produces,
  Response
} from 'tsoa'
import { readFile } from 'fs/promises'
import { Types } from 'mongoose'
import { createSessionService, isApiError } from '@sasjs/api'
import type {
  CallerDirectory,
  SessionArtifact,
  SessionHost,
  SessionSummary as ApiSessionSummary
} from '@sasjs/api'
import { UserResponse } from './user'
import { getSessionController } from './internal'
import {
  Session,
  SessionState,
  SessionStateResponse,
  SessionSummary
} from '../types'
import { extractHeaders, ModeType } from '../utils'
import { DESKTOP_USER_ID, desktopIdentityStore } from '../utils/desktopIdentity'
import User from '../model/User'

interface SessionResponse extends UserResponse {
  needsToUpdatePassword?: boolean
}

/**
 * The caller, as the package's service states one.
 *
 * Everything the session routes decide about a caller - whether the account is
 * active, whether it is an administrator, whether the session is theirs - is
 * resolved against this, so the routes do not pass a role.
 */
const subjectOf = (request: express.Request) => {
  const user = request.user
  if (!user) return undefined

  return { userId: user.userId, clientId: user.clientId }
}

/**
 * The account directory the session service reads.
 *
 * One method, because one is all it calls - who the caller is, whether the
 * account is still active, whether it is an administrator - so this is four
 * lines over the `User` model rather than an `IdentityStore` adapter with twenty
 * unimplemented methods. `groups` is populated from the document rather than
 * left empty: a directory that answered `[]` for a user who is in groups would
 * be a lie the next reader inherits.
 */
const directory: CallerDirectory = {
  async userById(uid) {
    // Desktop mode has one fixed user and no database behind it. Its id is the operating
    // system's for the account running the server (`DESKTOP_USER_ID`), never an ObjectId, so
    // the cast guard below would answer "no such account" and every session route would refuse
    // the only caller there is. The answer comes from the identity store rather than a second
    // rendering of the account, so a record the store reports is the account sessions describe.
    if (process.env.MODE === ModeType.Desktop && uid === DESKTOP_USER_ID) {
      const account = await desktopIdentityStore.userById(uid)

      return account && { ...account, groups: [] }
    }

    // a caller-supplied identifier reaches this from a token, and mongoose
    // throws a CastError on anything that is not an ObjectId - which a token
    // signed by someone else can carry. "No such account" is the answer.
    if (!Types.ObjectId.isValid(uid)) return undefined

    const user = await User.findById(uid)
    if (!user) return undefined

    return {
      uid: user.uid,
      username: user.username,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      needsToUpdatePassword: user.needsToUpdatePassword,
      autoExec: user.autoExec,
      groups: user.groups.map((group) => group.toString())
    }
  }
}

/**
 * The session a run time is holding, if any.
 *
 * Sessions are kept per runtime, so a caller that only knows an id has to ask
 * each controller in turn. An expired session and one that never existed are the
 * same thing to a caller - there is nothing left to read - so both are
 * `undefined`, which the service turns into its `404`.
 */
const findSession = (sessionId: string): Session | undefined => {
  for (const runTime of process.runTimes) {
    const session = getSessionController(runTime).getSessionById(sessionId)
    if (session) return session
  }

  return undefined
}

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

/** A session as the document describes one - the folder it lives in is not part of it. */
const summaryOf = (session: Session): ApiSessionSummary => ({
  sessionId: session.id,
  state: session.state,
  pid: session.pid,
  creationTimeStamp: session.creationTimeStamp,
  deathTimeStamp: session.deathTimeStamp,
  failureReason: session.failureReason,
  expiresAfterMins: session.expiresAfterMins
})

/**
 * The host's sessions, over the run times this process holds.
 *
 * Built per request because the output route has to apply the program's own
 * response headers to *this* response: reading `stpsrv_header.txt` and passing
 * the validated headers on is transport work, and it stays here rather than in
 * the package - which is why the port answers contents and a content type, not a
 * prepared response.
 */
const hostFor = (request: express.Request): SessionHost => ({
  async session(sessionId) {
    const session = findSession(sessionId)
    if (!session) return undefined

    return { owner: session.owner, summary: summaryOf(session) }
  },

  async state(sessionId) {
    const session = findSession(sessionId)
    if (!session) return undefined

    return { state: session.state }
  },

  async log(sessionId) {
    const session = findSession(sessionId)
    if (!session) return undefined

    return readArtifact(session, 'log.log')
  },

  async output(sessionId) {
    const session = findSession(sessionId)
    if (!session) return undefined

    const headers = extractHeaders(
      await readArtifact(session, 'stpsrv_header.txt')
    )

    // the synchronous execute path answers the same headers, and both go
    // through the same extraction so a program cannot inject one
    ;(request as any).sasHeaders = headers
    request.res?.header(headers)

    const webout = await readFile(path.join(session.path, 'webout.txt')).catch(
      () => undefined
    )

    return { contents: webout ?? '', contentType: headers['content-type'] }
  }
})

/** The four routes' decisions, over this host's sessions. */
const serviceFor = (request: express.Request) =>
  createSessionService(directory, hostFor(request))

/**
 * A refusal as these routes have always rendered one.
 *
 * `code` is what the router reads to choose the status, and the remaining object
 * is the body a client keys on (`{ message }`). The package's `ApiError` is the
 * same decision under another name, so it is translated rather than re-decided;
 * anything else keeps its own shape and becomes whatever the server's error
 * handler makes of a host bug - never a 404 the API appears to have chosen.
 */
const asRefusal = (error: unknown): never => {
  if (isApiError(error)) throw { code: error.status, message: error.message }

  throw error
}

/**
 * The four session routes, as `@sasjs/api` decides them.
 *
 * The package owns what these routes answer - the `404` that hides a foreign
 * session as readily as a missing one, the wording, and the owner rule (the uid
 * first, because our records carry the username, which the package accepts as
 * the fallback). What is left here is the host's half: finding the session in
 * whichever run time holds it, and reading the files it wrote.
 */
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
  @Response(401, 'No valid access token or session was supplied')
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
  @Response(401, 'No valid access token or session was supplied')
  @Response(404, 'Session with the given ID was not found.')
  @Get('/:sessionId/state')
  public async sessionState(
    @Request() request: express.Request,
    @Path() sessionId: string
  ): Promise<SessionStateResponse> {
    try {
      const state = await serviceFor(request).state(
        subjectOf(request),
        sessionId
      )

      return state as unknown as SessionStateResponse
    } catch (error) {
      return asRefusal(error)
    }
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
  @Response(401, 'No valid access token or session was supplied')
  @Response(404, 'Session with the given ID was not found.')
  @Get('/:sessionId')
  public async sessionDetail(
    @Request() request: express.Request,
    @Path() sessionId: string
  ): Promise<SessionSummary> {
    try {
      const summary = await serviceFor(request).summary(
        subjectOf(request),
        sessionId
      )

      // The package types these as it can know them - `state` is a string
      // because a host's vocabulary is its own, and the stamps are optional
      // because a session that has not finished has no death stamp yet. This
      // host's vocabulary is the enum the document names, and its records carry
      // both stamps from the moment the session is created.
      return {
        sessionId: summary.sessionId,
        state: summary.state as SessionState,
        pid: summary.pid,
        creationTimeStamp: summary.creationTimeStamp as string,
        deathTimeStamp: summary.deathTimeStamp as string,
        failureReason: summary.failureReason,
        expiresAfterMins: summary.expiresAfterMins
      }
    } catch (error) {
      return asRefusal(error)
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
  @Response(401, 'No valid access token or session was supplied')
  @Response(404, 'Session with the given ID was not found.')
  @Get('/:sessionId/log')
  public async sessionLog(
    @Request() request: express.Request,
    @Path() sessionId: string
  ): Promise<string> {
    try {
      return await serviceFor(request).log(subjectOf(request), sessionId)
    } catch (error) {
      return asRefusal(error)
    }
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
  @Response(401, 'No valid access token or session was supplied')
  @Response(404, 'Session with the given ID was not found.')
  @Get('/:sessionId/output')
  public async sessionOutput(
    @Request() request: express.Request,
    @Path() sessionId: string
  ): Promise<string | Buffer> {
    try {
      const artifact: SessionArtifact = await serviceFor(request).output(
        subjectOf(request),
        sessionId
      )

      // the route answers a Buffer with the session's own headers, so bytes stay
      // bytes here: converting them to text would corrupt a binary attachment
      return typeof artifact.contents === 'string'
        ? artifact.contents
        : Buffer.from(artifact.contents)
    } catch (error) {
      return asRefusal(error)
    }
  }
}

const session = (req: express.Request) => ({
  uid: req.user!.userId,
  username: req.user!.username,
  displayName: req.user!.displayName,
  isAdmin: req.user!.isAdmin,
  needsToUpdatePassword: req.user!.needsToUpdatePassword
})
