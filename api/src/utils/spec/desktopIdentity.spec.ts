/**
 * Desktop mode's identity comes from the framework's store, and from one place.
 *
 * The failure this pins is a drift the server actually had: `authenticateAccessToken` ran
 * as one account (`12345`, the OS user, from `desktopUser`) while `authenticateRefreshToken`
 * built a second one inline (`1234`, `desktopModeUsername`), so the same desktop request was
 * two identities depending on which middleware saw it - and neither went through the
 * package's `authenticate`.
 */

import { NextFunction, Request, Response } from 'express'
import { mkdirSync, rmSync } from 'fs'
import * as os from 'os'
import { tmpdir, userInfo } from 'os'
import path from 'path'

/**
 * Where the desktop auto-exec file is looked for during these tests.
 *
 * The real location is the running user's home, so a machine that happens to have a file
 * there would decide the result - which is exactly how the first version of the "never set"
 * case passed locally and failed in CI. Pinning the path is what makes both cases about the
 * code rather than about the box.
 */
// The account read is guarded against a platform that cannot name its own uid; this lets the
// case below make `userInfo()` throw without touching the builtin.
jest.mock('os', () => {
  const actual = jest.requireActual('os')

  return { ...actual, userInfo: jest.fn(actual.userInfo) }
})

const mockAutoExecPath = path.join(
  tmpdir(),
  `desktop-autoexec-${process.pid}-test.sas`
)

jest.mock('../../utils/file', () => ({
  ...jest.requireActual('../../utils/file'),
  getDesktopUserAutoExecPath: () => mockAutoExecPath
}))
import {
  DESKTOP_ACCESS_TOKEN,
  DESKTOP_USER_ID,
  desktopCaller,
  desktopIdentity,
  desktopIdentityStore,
  desktopUserId
} from '../desktopIdentity'
import { desktopRestrict } from '../../middlewares/desktop'
import {
  authenticateAccessToken,
  authenticateRefreshToken
} from '../../middlewares/authenticateToken'
import { ModeType } from '..'

const fakeRequest = (): Request =>
  // the refusal path drains the body, which resolves immediately for a request that
  // carries none - `readableEnded` is what tells it so
  ({ headers: {}, readableEnded: true, complete: true }) as unknown as Request
const fakeResponse = () =>
  ({
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis()
  }) as unknown as Response

describe('desktop identity', () => {
  const originalMode = process.env.MODE
  const originalSecrets = process.secrets

  beforeEach(() => {
    process.env.MODE = ModeType.Desktop
    process.secrets = {
      ...originalSecrets,
      ACCESS_TOKEN_SECRET: 'testsecret1',
      REFRESH_TOKEN_SECRET: 'testsecret2'
    }
  })

  afterEach(() => {
    process.env.MODE = originalMode
    process.secrets = originalSecrets
  })

  it('resolve the seeded token to the desktop account', async () => {
    const subject = await desktopIdentity.authenticate(DESKTOP_ACCESS_TOKEN)

    expect(subject).toEqual({
      userId: DESKTOP_USER_ID,
      clientId: 'desktop_app'
    })
  })

  it('refuse a token the store does not hold', async () => {
    // the store is the authority: a literal is only the caller's identity while the
    // store still accepts it
    await expect(
      desktopIdentity.authenticate('someOtherToken')
    ).resolves.toBeUndefined()
  })

  it('answer the caller as the OS user, an administrator, active', async () => {
    const caller = await desktopCaller()

    expect(caller).toEqual({
      userId: DESKTOP_USER_ID,
      clientId: 'desktop_app',
      username: userInfo().username,
      displayName: userInfo().username,
      isAdmin: true,
      isActive: true,
      needsToUpdatePassword: false
    })
  })

  it('answer the caller the record the store holds', async () => {
    // One account, one rendering: the caller the middlewares hand on is the store's record,
    // so a record edited through the store reaches every route that resolves it.
    const record = await desktopIdentityStore.userById(DESKTOP_USER_ID)
    const caller = await desktopCaller()

    expect(caller).toEqual({
      userId: record!.uid,
      clientId: 'desktop_app',
      username: record!.username,
      displayName: record!.displayName,
      isAdmin: record!.isAdmin,
      isActive: record!.isActive,
      needsToUpdatePassword: record!.needsToUpdatePassword
    })
  })

  it('resolve both middlewares to the same caller', async () => {
    const access = fakeRequest()
    const refresh = fakeRequest()
    const next = jest.fn() as unknown as NextFunction

    await authenticateAccessToken(access, fakeResponse(), next)
    await authenticateRefreshToken(refresh, fakeResponse(), next)

    expect(access.user?.userId).toBe(DESKTOP_USER_ID)
    expect(refresh.user).toEqual(access.user)
    expect(refresh.accessToken).toBe(DESKTOP_ACCESS_TOKEN)
  })

  it('name the caller by the uid where the platform has one', () => {
    expect(desktopUserId({ uid: 1000, username: 'ada' })).toBe('1000')
  })

  it('name the caller by the account where the platform reports none', () => {
    // Node answers uid -1 on Windows and does not expose the SID. -1 is truthy, so a
    // falsiness check would name every Windows desktop "-1" - which is what this pins.
    expect(desktopUserId({ uid: -1, username: 'ada' })).toBe('ada')
    expect(desktopUserId({ uid: '-1', username: 'ada' })).toBe('ada')
  })

  it('make an id a path segment can carry', () => {
    // a directory account answers DOMAIN\name, and the profile route puts the id in a path
    expect(desktopUserId({ uid: -1, username: 'DOMAIN\\ada' })).toBe(
      'DOMAIN-ada'
    )
    expect(desktopUserId({ uid: -1, username: 'ada smith' })).toBe('ada-smith')
  })

  it('name the account even when the platform has no passwd entry for it', () => {
    // os.userInfo() throws for a uid nothing names - a container started with `--user 12345` -
    // and this module is imported in every mode, so an unguarded call would stop the server at
    // start-up. The number is the only identity such a process has.
    ;(os.userInfo as unknown as jest.Mock).mockImplementationOnce(() => {
      throw new Error('no passwd entry')
    })

    let id: string | undefined

    jest.isolateModules(() => {
      id = require('../desktopIdentity').DESKTOP_USER_ID
    })

    expect(id).toBe(
      typeof process.getuid === 'function'
        ? String(process.getuid())
        : 'desktop'
    )
  })

  it('fall back to a name where the platform reports neither', () => {
    expect(desktopUserId({ uid: -1, username: '' })).toBe('desktop')
  })

  it('derive the running machine identically', () => {
    expect(DESKTOP_USER_ID).toBe(desktopUserId(userInfo()))
    expect(DESKTOP_USER_ID).toMatch(/^[A-Za-z0-9._-]+$/)
  })

  it('refuse a caller the store no longer holds, as a 401', async () => {
    // resolving through the store is only worth anything if a store that refuses produces a
    // refusal: an unhandled rejection would leave the handler and answer 500 through app.ts
    await desktopIdentityStore.updateUser(DESKTOP_USER_ID, { isActive: false })

    try {
      const req = fakeRequest()
      const res = fakeResponse()

      await authenticateAccessToken(
        req,
        res,
        jest.fn() as unknown as NextFunction
      )

      expect(res.status).toHaveBeenCalledWith(401)
      expect(req.user).toBeUndefined()
    } finally {
      await desktopIdentityStore.updateUser(DESKTOP_USER_ID, { isActive: true })
    }
  })

  it('answer the profile routes from the store, not a snapshot', async () => {
    // the desktop branches of getUser and the auto-exec routes used to answer from
    // `desktopUser`, the module-load snapshot, so a record the store reported would reach
    // `req.user` and leave the profile routes describing the seed
    await desktopIdentityStore.updateUser(DESKTOP_USER_ID, {
      displayName: 'Renamed Caller'
    })

    try {
      // imported here: the controller pulls the mongoose models in at module load
      const { UserController } = await import('../../controllers/user')
      const controller = new UserController()

      const detail = await controller.getUser(fakeRequest(), DESKTOP_USER_ID)

      expect(detail.displayName).toBe('Renamed Caller')
      expect(detail.uid).toBe(DESKTOP_USER_ID)
    } finally {
      await desktopIdentityStore.updateUser(DESKTOP_USER_ID, {
        displayName: userInfo().username
      })
    }
  })

  it('answer an empty auto-exec for a desktop that has never set one', async () => {
    // readFile rejects on a missing file and a fresh install has none, so the profile route
    // answered 500 with an ENOENT stack until the user had saved an auto-exec they had no way
    // to reach. The file's location is the user's home, so the test moves it rather than
    // trusting whatever the machine running it happens to have there.
    const { getUserAutoExec } = await import('../../utils/desktopAutoExec')

    await expect(getUserAutoExec()).resolves.toBe('')
  })

  it('report a fault that is not a missing auto-exec', async () => {
    // Only a missing file means "not set": this value is also handed to every program a
    // desktop user runs, so a directory sitting where the file belongs must surface rather
    // than quietly running the code without the user's auto-exec.
    mkdirSync(mockAutoExecPath, { recursive: true })
    const { getUserAutoExec } = await import('../../utils/desktopAutoExec')

    try {
      await expect(getUserAutoExec()).rejects.toMatchObject({ code: 'EISDIR' })
    } finally {
      rmSync(mockAutoExecPath, { recursive: true, force: true })
    }
  })

  it('hold the account the store was seeded with', async () => {
    // the record the fixture declares is the one `userById` answers, so a change to the
    // fixture reaches both the resolver and the profile routes
    const user = await desktopIdentityStore.userById(DESKTOP_USER_ID)

    expect(user).toEqual(
      expect.objectContaining({
        uid: DESKTOP_USER_ID,
        isAdmin: true,
        isActive: true
      })
    )
  })
})

describe('the desktop route guard', () => {
  const originalMode = process.env.MODE

  beforeEach(() => {
    process.env.MODE = ModeType.Desktop
  })

  afterEach(() => {
    process.env.MODE = originalMode
  })

  const guard = (method: string, url: string) => {
    const req = { method, originalUrl: url } as unknown as Request
    const res = fakeResponse()
    const next = jest.fn()

    desktopRestrict(req, res, next as unknown as NextFunction)

    return { next, res }
  }

  it('allow the caller their own profile', () => {
    for (const [method, url] of [
      ['GET', `/SASjsApi/user/${DESKTOP_USER_ID}`],
      ['GET', `/SASjsApi/user/${DESKTOP_USER_ID}/`],
      ['GET', `/SASjsApi/user/${DESKTOP_USER_ID}?fields=autoExec`],
      ['PATCH', `/SASjsApi/user/${DESKTOP_USER_ID}`]
    ]) {
      const { next, res } = guard(method, url)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    }
  })

  it('refuse anyone else, and every other route', () => {
    // the guard's intent is "your own profile only". It was written as `[0-9]*` against the
    // old '12345' sentinel, which refuses a Windows desktop - whose id is a name, because
    // Node answers -1 for the uid there - so this pins that the decision follows the id
    // rather than a digit pattern.
    for (const [method, url] of [
      ['GET', '/SASjsApi/user/99999'],
      ['PATCH', '/SASjsApi/user/99999'],
      ['GET', '/SASjsApi/user'],
      ['POST', `/SASjsApi/user/${DESKTOP_USER_ID}`],
      ['GET', '/SASjsApi/drive/fileTree'],
      ['GET', '/SASLogon/logout']
    ]) {
      const { next, res } = guard(method, url)

      expect(next).not.toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(403)
    }
  })
})

describe('a store that cannot answer', () => {
  const originalMode = process.env.MODE
  const originalSecrets = process.secrets

  beforeEach(() => {
    process.env.MODE = ModeType.Desktop
    process.secrets = {
      ...originalSecrets,
      ACCESS_TOKEN_SECRET: 'testsecret1',
      REFRESH_TOKEN_SECRET: 'testsecret2'
    }
  })

  afterEach(() => {
    process.env.MODE = originalMode
    process.secrets = originalSecrets
  })

  it('is reported as a 500, not a 401', async () => {
    // A store seeded with no account is the installation being broken, not a caller without
    // a token: answering 401 would hide it behind a login screen this mode does not have.
    // Last in the file, because deleting the account leaves the store unusable and the store
    // is seeded once per module load.
    const logged = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    await desktopIdentityStore.deleteUser(DESKTOP_USER_ID)

    try {
      const res = fakeResponse()

      await authenticateAccessToken(
        fakeRequest(),
        res,
        jest.fn() as unknown as NextFunction
      )

      expect(res.status).toHaveBeenCalledWith(500)
      expect(logged).toHaveBeenCalled()
    } finally {
      logged.mockRestore()
    }
  })
})
