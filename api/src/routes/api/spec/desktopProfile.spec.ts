/**
 * The desktop caller's own profile, through the real router.
 *
 * `desktopIdentity.spec.ts` calls the controller directly, so it never runs the path
 * parameter validation this route applies first - and that validation required a 24-character
 * hex ObjectId. Desktop mode's account id is the operating system's (`1000` on a Linux box, a
 * sanitised account name on Windows), so `GET` and `PATCH /SASjsApi/user/<own id>` answered
 * `400 "uid" length must be 24 characters long` before the controller was reached: the
 * profile screen could neither read nor save the desktop auto-exec, and the guard that admits
 * this route was serving a route that could not answer.
 *
 * The cases below go through `app`, so the guard, the validation and the controller all run.
 */

import { existsSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'

import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'

import appPromise from '../../../app'
import {
  DESKTOP_USER_ID,
  desktopIdentityStore
} from '../../../utils/desktopIdentity'
import { ModeType } from '../../../utils'
import { getUserAutoExec } from '../../../utils/desktopAutoExec'

/**
 * Where the auto-exec file is looked for during these cases.
 *
 * Its real location is the running user's home, so a PATCH here would overwrite a
 * developer's own auto-exec and leave it there - and the assertion would then be satisfied by
 * whatever an earlier run had written rather than by the request under test. Pinning the path
 * keeps the case about the route.
 */
const mockAutoExecPath = path.join(
  tmpdir(),
  `desktop-profile-autoexec-${process.pid}-test.sas`
)

jest.mock('../../../utils/file', () => ({
  ...jest.requireActual('../../../utils/file'),
  getDesktopUserAutoExecPath: () => mockAutoExecPath
}))

describe('the desktop profile route', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const originalMode = process.env.MODE

  beforeAll(async () => {
    // the app builds its routers per mode, so this must be set before it is resolved
    process.env.MODE = ModeType.Desktop

    app = await appPromise

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())
  })

  afterAll(async () => {
    process.env.MODE = originalMode
    await con.disconnect()
    await mongoServer.stop()
  })

  it('answers the caller its own profile', async () => {
    const res = await request(app)
      .get(`/SASjsApi/user/${DESKTOP_USER_ID}`)
      .expect(200)

    const record = await desktopIdentityStore.userById(DESKTOP_USER_ID)

    expect(res.body.uid).toBe(DESKTOP_USER_ID)
    expect(res.body.username).toBe(record!.username)
    expect(res.body.isAdmin).toBe(true)
  })

  it('saves the auto-exec the profile form sends', async () => {
    // start from no file, so what is read back is what this request wrote
    if (existsSync(mockAutoExecPath)) rmSync(mockAutoExecPath)

    const res = await request(app)
      .patch(`/SASjsApi/user/${DESKTOP_USER_ID}`)
      .send({ autoExec: 'data _null_; put "desktop"; run;' })
      .expect(200)

    try {
      expect(res.body.uid).toBe(DESKTOP_USER_ID)
      await expect(getUserAutoExec()).resolves.toContain('desktop')
    } finally {
      if (existsSync(mockAutoExecPath)) rmSync(mockAutoExecPath)
    }
  })

  it('leaves the auto-exec alone when the body does not carry one', async () => {
    // A PATCH that is not about auto-exec used to erase the file: `body.autoExec ?? ''` wrote an
    // empty string and answered 200, so a profile update silently destroyed the caller's code.
    await desktopIdentityStore.userById(DESKTOP_USER_ID)

    await request(app)
      .patch(`/SASjsApi/user/${DESKTOP_USER_ID}`)
      .send({ autoExec: 'options nosource;' })
      .expect(200)

    const res = await request(app)
      .patch(`/SASjsApi/user/${DESKTOP_USER_ID}`)
      .send({})
      .expect(200)

    expect(res.body.autoExec).toBe('options nosource;')
    await expect(getUserAutoExec()).resolves.toBe('options nosource;')
  })

  it('accepts the profile the Settings screen posts back unchanged', async () => {
    // The only client of this route sends `{ username, displayName, autoExec }` on every save,
    // echoing what it read. Refusing an echoed field refused the desktop's own Save Changes -
    // and with it the auto-exec editor, which is the reason this route is reachable in this
    // mode at all.
    const record = await desktopIdentityStore.userById(DESKTOP_USER_ID)

    const res = await request(app)
      .patch(`/SASjsApi/user/${DESKTOP_USER_ID}`)
      .send({
        username: record!.username,
        displayName: record!.displayName,
        autoExec: 'options nonotes;'
      })
      .expect(200)

    expect(res.body.autoExec).toBe('options nonotes;')
    await expect(getUserAutoExec()).resolves.toBe('options nonotes;')
  })

  it('refuses a field desktop mode cannot change, instead of discarding it', async () => {
    const res = await request(app)
      .patch(`/SASjsApi/user/${DESKTOP_USER_ID}`)
      .send({ displayName: 'Somebody Else' })
      .expect(400)

    expect(res.text).toContain('displayName')
  })

  it('still refuses a caller other than the desktop account', async () => {
    // the guard runs before the validation: someone else's id is a 403, not a 400
    await request(app).get('/SASjsApi/user/99999').expect(403)
  })

  it('answers the record the store holds, not a module-load copy', async () => {
    // The case above would pass on a controller that answered a snapshot: the snapshot and the
    // seed agree until one of them changes. Renaming the store's record is what tells them
    // apart, and the route has to report the new name.
    const record = await desktopIdentityStore.userById(DESKTOP_USER_ID)

    await desktopIdentityStore.updateUser(DESKTOP_USER_ID, {
      displayName: 'Renamed Desktop Caller'
    })

    try {
      const res = await request(app)
        .get(`/SASjsApi/user/${DESKTOP_USER_ID}`)
        .expect(200)

      expect(res.body.displayName).toBe('Renamed Desktop Caller')
    } finally {
      await desktopIdentityStore.updateUser(DESKTOP_USER_ID, {
        displayName: record!.displayName
      })
    }
  })
})
