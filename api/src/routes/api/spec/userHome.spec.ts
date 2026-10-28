import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import fs from 'fs'
import path from 'path'
import { folderExists } from '@sasjs/utils'

import appPromise from '../../../app'
import { UserController } from '../../../controllers/'
import Group from '../../../model/Group'
import Permission from '../../../model/Permission'
import User from '../../../model/User'
import {
  generateAccessToken,
  getFilesFolder,
  saveTokensInDB
} from '../../../utils'
import {
  USER_HOME_ROUTES,
  provisionAllUserHomes
} from '../../../utils/provisionUserHome'
import { userHomeFolderFor, userHomeSegment } from '../../../utils/userHomePath'

/**
 * A user's home folder (sasjs/server): the folder Studio opens on, and the
 * grants that reach it.
 *
 * Studio resolves `/home/<username>/program.sas` and needs the drive routes to
 * read and write it, so an account has to arrive with both. Without them a new
 * user meets an empty tree and a 401 on the first save.
 */

// mongodb-memory-server copies a binary into /tmp on first use, which is slow
// on a small tmpfs; the default 5s hook budget is not enough for it.
jest.setTimeout(120000)

const clientId = 'someclientID'

const user = {
  displayName: 'Home User',
  username: 'homeuser',
  password: '87654321',
  isAdmin: false,
  isActive: true
}

describe('user home provisioning', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const userController = new UserController()

  const homeDir = (name: string) => path.join(getFilesFolder(), 'home', name)

  /** A bearer token for a user, as the auth routes would issue one. */
  const tokenFor = async (userId: string) => {
    const token = generateAccessToken({ clientId, userId })
    await saveTokensInDB(userId, clientId, token, 'refreshToken')
    return token
  }

  beforeAll(async () => {
    app = await appPromise

    // The drive outlives the database, so a previous run's folders are still
    // there. This spec owns ./home for the length of a run.
    fs.rmSync(path.join(getFilesFolder(), 'home'), {
      recursive: true,
      force: true
    })

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    // The seed creates this group on a real server; in a bare test database
    // nobody has, and an account can only be given a membership that exists.
    await new Group({
      name: 'all-users',
      description: 'Group contains all users'
    }).save()
  })

  afterAll(async () => {
    // Leave the shared drive as it was found: other specs list its root.
    fs.rmSync(path.join(getFilesFolder(), 'home'), {
      recursive: true,
      force: true
    })

    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  it('names the folder after the username, safely', () => {
    expect(userHomeFolderFor('homeuser')).toBe('/home/homeuser')
    expect(userHomeFolderFor('HomeUser')).toBe('/home/homeuser')
    expect(userHomeFolderFor('a b')).toBe('/home/a-b')
    expect(userHomeFolderFor('../../etc')).toBe('/home/etc')
    // A name that folds away gets no home at all, rather than sharing one.
    expect(userHomeSegment('..')).toBe('')
    expect(userHomeFolderFor('..')).toBe('')
  })

  it('creates the folder and the group membership with the account', async () => {
    expect(await folderExists(homeDir(user.username))).toBe(false)

    const created = await userController.createUser(user)

    expect(fs.existsSync(homeDir(user.username))).toBe(true)

    const group = await Group.findOne({ name: 'all-users' })
    const members = (group?.users ?? []).map((member) => String(member))
    expect(members).toContain(String(created.uid))
  })

  it('refuses the home folder before the baseline grants exist', async () => {
    // The user is real and authenticated; the drive routes are not granted yet,
    // which is what the startup pass is for.
    const dbUser = await User.findOne({ username: user.username })
    const token = await tokenFor(dbUser!.uid)

    await request(app)
      .get('/SASjsApi/drive/fileTree')
      .query({ _folderPath: `/home/${user.username}` })
      .auth(token, { type: 'bearer' })
      .expect(401)
  })

  it('grants the drive routes once, to the all-users group', async () => {
    const first = await provisionAllUserHomes()

    expect(first.grants).toBe(USER_HOME_ROUTES.length)

    const group = await Group.findOne({ name: 'all-users' })
    const grants = await Permission.find({
      type: 'Route',
      setting: 'Grant',
      group: group!._id
    })

    expect(grants.map((grant) => grant.path).sort()).toEqual(
      [...USER_HOME_ROUTES].sort()
    )

    // Running submitted code is not part of having a folder.
    expect(grants.map((grant) => grant.path)).not.toContain(
      '/SASjsApi/code/execute'
    )

    // One rule per route, not one per account.
    expect(await Permission.countDocuments({ type: 'Route' })).toBe(
      USER_HOME_ROUTES.length
    )
  })

  it('lets the user reach their own home folder afterwards', async () => {
    const dbUser = await User.findOne({ username: user.username })
    const token = await tokenFor(dbUser!.uid)

    const tree = await request(app)
      .get('/SASjsApi/drive/fileTree')
      .query({ _folderPath: `/home/${user.username}` })
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(tree.body.status).toBe('success')
  })

  it('is idempotent: a second pass adds no duplicates and no folders', async () => {
    const before = await Permission.countDocuments({ type: 'Route' })

    const again = await provisionAllUserHomes()

    expect(again.folders).toBe(0)
    expect(again.grants).toBe(0)
    expect(await Permission.countDocuments({ type: 'Route' })).toBe(before)
  })

  it('leaves an existing folder and its contents alone', async () => {
    const marker = path.join(homeDir(user.username), 'mine.sas')
    fs.writeFileSync(marker, 'data want;\nrun;\n')

    await provisionAllUserHomes()

    expect(fs.readFileSync(marker, 'utf8')).toContain('data want')
  })

  it('provisions accounts that predate this', async () => {
    // Created straight into the collection, as an older release would have
    // left it: no folder, no membership.
    const legacy = await new User({
      displayName: 'Legacy User',
      username: 'legacyuser',
      password: User.hashPassword('87654321'),
      isAdmin: false,
      isActive: true
    }).save()

    expect(await folderExists(homeDir('legacyuser'))).toBe(false)

    await provisionAllUserHomes()

    expect(await folderExists(homeDir('legacyuser'))).toBe(true)

    const group = await Group.findOne({ name: 'all-users' })
    expect((group?.users ?? []).map((m) => String(m))).toContain(
      String(legacy._id)
    )
  })

  it('does not fail an account creation when the name cannot have a home', async () => {
    const odd = await userController.createUser({
      displayName: 'Odd User',
      username: '!!',
      password: '87654321',
      isAdmin: false,
      isActive: true
    })

    expect(odd.uid).toBeTruthy()
    // No folder was made, and none was invented from the fallback name.
    expect(
      await folderExists(path.join(getFilesFolder(), 'home', 'anonymous'))
    ).toBe(false)
  })
})
