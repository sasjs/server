import { Types } from 'mongoose'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import User, { IUserDocument } from '../User'
import Group from '../Group'
import { AuthProviderType } from '../../utils/verifyEnvVariables'

/**
 * Membership updates must survive running concurrently.
 *
 * `Group.addUser` / `removeUser` update the user's `groups` array as well as the
 * group's `users`, and two sign-ins for the same user - or a sign-in and a
 * directory sync - can overlap. A `save()` of a document with a modified array
 * carries a version filter, so the second update to land matches no document and
 * throws
 *
 *   VersionError: No matching document found for id ... modifiedPaths "groups"
 *
 * These tests pin the membership updates to non-versioned atomic operators,
 * which cannot lose that race.
 */
describe('membership updates under concurrency', () => {
  let con: Mongoose
  let mongoServer: MongoMemoryServer

  beforeAll(async () => {
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

  it('two overlapping group additions must not fail each other', async () => {
    const user = await createUser()
    const first = new Types.ObjectId()
    const second = new Types.ObjectId()

    // Two instances of the same user, which is what two concurrent sign-ins
    // (or a sign-in racing a directory sync) produce.
    const a = await User.findById(user._id)
    const b = await User.findById(user._id)

    await Promise.all([a!.addGroup(first), b!.addGroup(second)])

    const reloaded = await User.findById(user._id)

    expect((reloaded!.groups as Types.ObjectId[]).map(String).sort()).toEqual(
      [first, second].map(String).sort()
    )
  })

  it('an addition and a removal that overlap must both land', async () => {
    const user = await createUser()
    const stale = new Types.ObjectId()
    const fresh = new Types.ObjectId()

    await User.updateOne({ _id: user._id }, { $set: { groups: [stale] } })

    const a = await User.findById(user._id)
    const b = await User.findById(user._id)

    await Promise.all([a!.removeGroup(stale), b!.addGroup(fresh)])

    const reloaded = await User.findById(user._id)

    expect((reloaded!.groups as Types.ObjectId[]).map(String)).toEqual([
      String(fresh)
    ])
  })

  it('adding the same group twice leaves one membership', async () => {
    const user = await createUser()
    const group = new Types.ObjectId()

    await user.addGroup(group)
    await user.addGroup(group)

    const reloaded = await User.findById(user._id)

    expect((reloaded!.groups as Types.ObjectId[]).map(String)).toEqual([
      String(group)
    ])
  })
})
