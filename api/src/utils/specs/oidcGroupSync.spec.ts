import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import Group, { PUBLIC_GROUP_NAME } from '../../model/Group'
import User, { IUserDocument } from '../../model/User'
import { AuthProviderType } from '../verifyEnvVariables'
import { providerGroupNames, syncOidcGroups } from '../oidcGroupSync'

describe('oidcGroupSync', () => {
  let con: Mongoose
  let mongoServer: MongoMemoryServer

  beforeAll(async () => {
    ;(process as any).logger = { info: () => {}, error: () => {} }

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  afterEach(async () => {
    await Group.deleteMany({})
    await User.deleteMany({})
  })

  const createUser = async (username = 'alice'): Promise<IUserDocument> =>
    User.create({
      displayName: 'Alice Example',
      username,
      password: User.hashPassword('not-used-by-the-provider'),
      authProvider: AuthProviderType.OIDC,
      authProviderId: `sub-${username}`,
      isActive: true,
      needsToUpdatePassword: false
    })

  const groupNamesFor = async (user: IUserDocument): Promise<string[]> => {
    const groups = await Group.find({ users: user._id })

    return groups.map((group) => group.name).sort()
  }

  describe('providerGroupNames', () => {
    it('should trim, de-duplicate and drop unusable names', () => {
      expect(
        providerGroupNames([
          ' sasjs-users ',
          'sasjs-users',
          'sasjs-admins',
          '',
          '   ',
          PUBLIC_GROUP_NAME
        ])
      ).toEqual(['sasjs-users', 'sasjs-admins'])
    })

    it('should ignore values that are not strings', () => {
      // A malformed claim must not masquerade as a membership.
      expect(
        providerGroupNames([null, 42, 'sasjs-users'] as unknown as string[])
      ).toEqual(['sasjs-users'])
    })
  })

  describe('syncOidcGroups', () => {
    it('should create a provider-managed group per asserted membership', async () => {
      const user = await createUser()

      const result = await syncOidcGroups(user, ['sasjs-users'])

      expect(result).toEqual({
        added: ['sasjs-users'],
        removed: [],
        skipped: []
      })

      const group = await Group.findOne({ name: 'sasjs-users' })

      expect(group).not.toBeNull()
      expect(group?.authProvider).toEqual(AuthProviderType.OIDC)
      expect(group?.hasUser(user)).toEqual(true)
      expect(await groupNamesFor(user)).toEqual(['sasjs-users'])
    })

    it('should converge on the asserted memberships however often it runs', async () => {
      const user = await createUser()

      await syncOidcGroups(user, ['sasjs-users', 'sasjs-admins'])
      const second = await syncOidcGroups(user, ['sasjs-users', 'sasjs-admins'])

      expect(second.added).toEqual([])
      expect(second.removed).toEqual([])
      expect(await Group.countDocuments({})).toEqual(2)
      expect(await groupNamesFor(user)).toEqual(['sasjs-admins', 'sasjs-users'])

      // Repeated sign-ins must not accumulate memberships: a group lists each
      // member once, and a user carries each group once.
      const reloaded = await User.findById(user._id)
      const group = await Group.findOne({ name: 'sasjs-users' })

      expect(reloaded?.groups).toHaveLength(2)
      expect(group?.users).toHaveLength(1)
    })

    it('should drop a membership the provider no longer asserts', async () => {
      const user = await createUser()

      await syncOidcGroups(user, ['sasjs-users', 'sasjs-admins'])
      const result = await syncOidcGroups(user, ['sasjs-users'])

      expect(result.removed).toEqual(['sasjs-admins'])
      expect(await groupNamesFor(user)).toEqual(['sasjs-users'])

      // The group itself stays: a permission may point at it, and it is
      // restored the moment the provider asserts the membership again.
      const group = await Group.findOne({ name: 'sasjs-admins' })

      expect(group?.users).toHaveLength(0)
    })

    it('should leave a group it does not own alone', async () => {
      const user = await createUser()

      await Group.create({ name: 'sasjs-users', description: 'local group' })
      await Group.create({
        name: 'sasjs-admins',
        authProvider: AuthProviderType.LDAP
      })

      const result = await syncOidcGroups(user, ['sasjs-users', 'sasjs-admins'])

      expect(result.skipped).toEqual(['sasjs-users', 'sasjs-admins'])
      expect(await groupNamesFor(user)).toEqual([])

      // Neither group is adopted or populated.
      expect((await Group.findOne({ name: 'sasjs-users' }))?.authProvider).toBe(
        undefined
      )
      expect(
        (await Group.findOne({ name: 'sasjs-users' }))?.users
      ).toHaveLength(0)
      expect(
        (await Group.findOne({ name: 'sasjs-admins' }))?.users
      ).toHaveLength(0)
    })

    it('should not mirror the reserved pseudo-group', async () => {
      const user = await createUser()

      await syncOidcGroups(user, [PUBLIC_GROUP_NAME, 'sasjs-users'])

      expect(await Group.countDocuments({ name: PUBLIC_GROUP_NAME })).toEqual(0)
      expect(await groupNamesFor(user)).toEqual(['sasjs-users'])
    })

    it('should remove every provider membership when the provider asserts none', async () => {
      const user = await createUser()

      await syncOidcGroups(user, ['sasjs-users'])
      const result = await syncOidcGroups(user, [])

      expect(result.removed).toEqual(['sasjs-users'])
      expect(await groupNamesFor(user)).toEqual([])
    })

    it('should keep memberships of other users intact', async () => {
      const alice = await createUser('alice')
      const bob = await createUser('bob')

      await syncOidcGroups(alice, ['sasjs-users'])
      await syncOidcGroups(bob, ['sasjs-users'])
      await syncOidcGroups(alice, [])

      expect(await groupNamesFor(alice)).toEqual([])
      expect(await groupNamesFor(bob)).toEqual(['sasjs-users'])
    })
  })
})
