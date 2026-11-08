import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

/**
 * The directory is stubbed: these cases are about the glue between it and the
 * store - the uid-to-username map the import keys membership on, the provider
 * stamp, and the fact that nothing is deleted. The import rule itself is
 * `@sasjs/api`'s and is tested there; the store is covered beside this file.
 */
jest.mock('../../../utils/ldapClient', () => ({
  LDAPClient: { init: jest.fn() }
}))

import { AuthConfigController } from '../../authConfig'
import { LDAPClient } from '../../../utils'
import User from '../../../model/User'
import Group from '../../../model/Group'
import Permission from '../../../model/Permission'

let mongod: MongoMemoryServer

/** The directory's own view: members are directory uids, not usernames. */
const directory = {
  users: [
    { uid: 'uid-ada', username: 'ada', displayName: 'Ada Lovelace' },
    { uid: 'uid-grace', username: 'grace', displayName: 'Grace Hopper' }
  ],
  groups: [{ name: 'group-a', members: ['uid-ada', 'uid-not-a-user'] }]
}

const stubDirectory = (users = directory.users, groups = directory.groups) => {
  ;(LDAPClient.init as jest.Mock).mockResolvedValue({
    getAllLDAPUsers: async () => users,
    getAllLDAPGroups: async () => groups
  })
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
}, 60000)

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

beforeEach(() => {
  ;(process as any).logger = {
    info: jest.fn(),
    log: jest.fn(),
    error: jest.fn()
  }
  stubDirectory()
})

afterEach(async () => {
  await User.deleteMany({})
  await Group.deleteMany({})
  await Permission.deleteMany({})
  jest.clearAllMocks()
})

describe('POST /SASjsApi/authConfig/synchroniseWithLDAP', () => {
  it('imports the directory and reports the counts', async () => {
    const result = await new AuthConfigController().synchroniseWithLDAP()

    expect(result).toEqual({ userCount: 2, groupCount: 1 })
    expect(await User.countDocuments()).toBe(2)
  })

  it('stamps what it creates with the provider', async () => {
    await new AuthConfigController().synchroniseWithLDAP()

    for (const username of ['ada', 'grace']) {
      const user = await User.findOne({ username })
      expect(user!.authProvider).toEqual('ldap')
      expect(user!.needsToUpdatePassword).toBe(false)
    }

    const group = await Group.findOne({ name: 'group-a' })
    expect(group!.authProvider).toEqual('ldap')
  })

  it('keys membership by username, and skips a member the directory did not return as a user', async () => {
    await new AuthConfigController().synchroniseWithLDAP()

    const ada = await User.findOne({ username: 'ada' })
    const grace = await User.findOne({ username: 'grace' })
    const group = await Group.findOne({ name: 'group-a' })

    const members = group!.users.map((member: any) =>
      String(member._id ?? member)
    )

    expect(members).toEqual([String(ada!._id)])
    expect(members).not.toContain(String(grace!._id))
    // the uid the directory named is not what the API keys on
    expect(members).not.toContain('uid-ada')
  })

  it('leaves an account that already exists alone', async () => {
    const existing = await User.create({
      displayName: 'Ada Local',
      username: 'ada',
      password: User.hashPassword('a-local-password'),
      isAdmin: true,
      isActive: true,
      needsToUpdatePassword: true
    })

    const result = await new AuthConfigController().synchroniseWithLDAP()

    expect(result).toEqual({ userCount: 1, groupCount: 1 })

    const after = await User.findOne({ username: 'ada' })
    expect(after!.displayName).toEqual('Ada Local')
    expect(after!.isAdmin).toBe(true)
    expect(after!.needsToUpdatePassword).toBe(true)
    // not claimed by the directory, and its password still works
    expect(after!.authProvider).toBeUndefined()
    expect(after!.comparePassword('a-local-password')).toBe(true)
    expect(String(after!._id)).toEqual(String(existing._id))
  })

  it('does not delete a permission rule, or re-resolve its principal', async () => {
    const admin = await User.create({
      displayName: 'Local Admin',
      username: 'localadmin',
      password: User.hashPassword('a-local-password'),
      isAdmin: true,
      isActive: true
    })
    const rule = await Permission.create({
      path: '/SASjsApi/drive/file',
      type: 'user',
      setting: 'grant',
      user: admin._id
    })

    await new AuthConfigController().synchroniseWithLDAP()

    const rules = await Permission.find({})
    expect(rules).toHaveLength(1)
    expect(rules[0].path).toEqual('/SASjsApi/drive/file')
    expect(String(rules[0].user)).toEqual(String(admin._id))
    expect(String(rules[0]._id)).toEqual(String(rule._id))
  })

  it('imports nothing on a second run', async () => {
    await new AuthConfigController().synchroniseWithLDAP()
    const second = await new AuthConfigController().synchroniseWithLDAP()

    expect(second).toEqual({ userCount: 0, groupCount: 0 })
    expect(await User.countDocuments()).toBe(2)
    expect(await Group.countDocuments()).toBe(1)
  })
})
