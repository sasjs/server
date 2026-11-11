/**
 * Desktop mode's identity, as data rather than a bypass.
 *
 * Desktop mode has no login: every request runs as one fixed account and the
 * application reads it back through the same routes a signed-in caller uses. That
 * account used to be two declarations in this server - `desktopUser`, and a second
 * literal with a different id inside token verification - plus a token string that
 * nothing accepted, so the two could drift and neither went through the package's
 * `authenticate`.
 *
 * It is now a fixture: one user, one client, one seeded access token, held by the
 * package's `MemoryIdentityStore` and read through its `IdentityService`. This is the
 * same arrangement the browser mock runs, with a single account instead of a demo
 * set, so desktop mode exercises the hosted rules rather than stepping around them.
 *
 * What does not change: the account name (the OS user running the server) and that it is an
 * administrator. What does change: the id is no longer the `12345` placeholder but the OS's
 * own id for that user, because desktop mode has a real caller to name - see
 * `DESKTOP_USER_ID`.
 */

import { userInfo } from 'os'
import {
  ApiError,
  createIdentityService,
  IDENTITY_FORMAT,
  MemoryIdentityStore,
  type IdentityFixture,
  type IdentityFixtureUser
} from '@sasjs/api'
import { RequestUser } from '../types'

/**
 * The account's id: the operating system's id for the user running the server, or their
 * account name on a platform that exposes no uid.
 *
 * Desktop mode's one real advantage over the browser is that it *has* a caller - an OS
 * account, not a fixture. Using it is what lets the desktop's identity be an identity
 * rather than a placeholder, and it is the one thing the two modes cannot share: a browser
 * has no OS account to offer.
 *
 * Two shapes to survive. On Windows `os.userInfo().uid` is `-1` - Node does not expose the
 * SID - so the name is used there; a directory account can answer `DOMAIN\name`, which a
 * URL path segment cannot carry (the profile route puts this id in one) but nothing on disk
 * depends on it: sessions are keyed by session id and auto-exec lives at a fixed path. So
 * anything a path segment cannot carry becomes a dash, which keeps `DOMAIN\ada` legible
 * while making the value safe to match and to send.
 */
export const desktopUserId = (account: {
  uid: number | string
  username: string
}): string => {
  // On Windows `os.userInfo().uid` is -1 - Node does not expose the SID - and -1 is
  // truthy, so a check for falsiness would name every Windows desktop "-1". A negative
  // uid therefore means "this platform has none" and the account name is used instead.
  const raw =
    Number(account.uid) >= 0 ? String(account.uid) : account.username || ''

  const id = raw.replace(/[^A-Za-z0-9._-]/g, '-')

  return id || 'desktop'
}

/**
 * The account this process runs as.
 *
 * `os.userInfo()` throws when the running uid has no passwd entry to name it - a container
 * started with `--user 12345`, an arbitrary-UID platform - and this module is loaded in every
 * mode (`utils/validation.ts` imports it), so an unguarded call here would stop the server
 * before it served anything. `verifyEnvVariables.ts` guards the same call for the same reason.
 * The number is the only identity such a process has, so it becomes both the id and the name.
 */
const osAccount = (): { uid: number | string; username: string } => {
  const uid = typeof process.getuid === 'function' ? process.getuid() : -1

  try {
    const info = userInfo()

    return { uid: info.uid, username: info.username }
  } catch {
    return { uid, username: `uid ${uid}` }
  }
}

export const DESKTOP_USER_ID = desktopUserId(osAccount())

/** The client the desktop application acts as. */
export const DESKTOP_CLIENT_ID = 'desktop_app'

/**
 * The token every desktop request carries.
 *
 * Nothing verifies it on the wire - there is no login and no refresh - but it is now a
 * token the store actually holds, so `authenticate` resolves it to the account rather
 * than the middleware asserting the caller outright.
 */
export const DESKTOP_ACCESS_TOKEN = 'desktopModeAccessToken'

/**
 * Its pair.
 *
 * A seeded access token authenticates only alongside the refresh token it was issued
 * with - the store's read paths check the pair, not the token alone, because that is
 * what a session is. Desktop mode never refreshes, but the pair is what makes the
 * access token a live one rather than a string the store happens to hold.
 */
export const DESKTOP_REFRESH_TOKEN = 'desktopModeRefreshToken'

/** Seconds the desktop pair would live were it ever to expire; absent a login, never. */
const SECONDS_IN_A_DAY = 86400

const desktopUserRecord = (): IdentityFixtureUser => ({
  uid: DESKTOP_USER_ID,
  username: osAccount().username,
  displayName: osAccount().username,
  isAdmin: true,
  isActive: true,
  needsToUpdatePassword: false
})

const desktopFixture = (): IdentityFixture => {
  const user = desktopUserRecord()

  return {
    format: IDENTITY_FORMAT,
    users: [user],
    groups: [],
    permissions: [],
    clients: [
      {
        clientId: DESKTOP_CLIENT_ID,
        clientSecret: '',
        accessTokenExpiration: SECONDS_IN_A_DAY,
        refreshTokenExpiration: SECONDS_IN_A_DAY
      }
    ],
    tokens: [
      {
        username: user.username,
        clientId: DESKTOP_CLIENT_ID,
        accessToken: DESKTOP_ACCESS_TOKEN,
        refreshToken: DESKTOP_REFRESH_TOKEN
      }
    ]
  }
}

/** The store desktop mode runs on: the package's memory store, seeded with one account. */
export const desktopIdentityStore = new MemoryIdentityStore(desktopFixture())

/** The package's sign-in decisions, over that store. */
export const desktopIdentity = createIdentityService(desktopIdentityStore)

/**
 * The caller, in the shape the rest of this server passes around.
 *
 * Resolved through `authenticate` and `userById`, so a deactivated account or a token the
 * store no longer holds fails here rather than being assumed by the caller - and a store
 * that refuses is answered as a refusal (401) by the middleware, not as a crash.
 *
 * The record is read on every call, which is why the profile routes resolve their caller
 * through this rather than reading a module-load snapshot: a record the store reports is the
 * account they describe. The auto-exec code is not held here - it is data, not identity, and
 * stays in its file beside the rest of the desktop's state.
 */
export const desktopCaller = async (): Promise<RequestUser> => {
  const subject = await desktopIdentity.authenticate(DESKTOP_ACCESS_TOKEN)

  if (!subject) {
    // `authenticate` refuses a deactivated account as well as a token the store does not
    // hold, so ask the store what it has before blaming the installation. The status is the
    // distinction the middleware acts on: 401 is a caller who may not act, 500 is a store
    // that cannot answer, which is a broken installation rather than a missing token.
    const account = await desktopIdentityStore.userById(DESKTOP_USER_ID)

    if (account)
      throw new ApiError(
        401,
        `Desktop mode: the account ${DESKTOP_USER_ID} is not active.`
      )

    throw new ApiError(
      500,
      'Desktop mode: the identity store holds no account for its own access token.'
    )
  }

  const user = await desktopIdentityStore.userById(subject.userId)

  if (!user)
    throw new ApiError(
      500,
      `Desktop mode: the identity store holds no account for ${subject.userId}.`
    )

  return {
    userId: user.uid,
    clientId: subject.clientId,
    username: user.username,
    displayName: user.displayName,
    isAdmin: user.isAdmin,
    isActive: user.isActive,
    needsToUpdatePassword: user.needsToUpdatePassword
  }
}
