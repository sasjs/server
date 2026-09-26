import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import User from '../../model/User'
import { seedDB } from '../../utils/seedDB'

/**
 * The local admin is seeded ONLY when ADMIN_PASSWORD_INITIAL is set. With no
 * password configured there is no admin at all, and the first user to
 * authenticate through an external provider becomes one
 * (utils/oidcUser.resolveOidcUser) - which is what makes a fresh install
 * usable without a credential nobody can read.
 *
 * The failure this guards against is the previous behaviour: an absent
 * password was hashed anyway, creating an account whose password was the
 * literal string 'undefined' - a known credential on every deployment that
 * forgot the variable.
 */
describe('seedDB admin seeding', () => {
  let con: Mongoose
  let mongoServer: MongoMemoryServer

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    // seedDB logs through the process-level logger the app installs at
    // startup; these specs never boot the app.
    ;(process as any).logger = {
      log: jest.fn(),
      info: jest.fn(),
      success: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }
  })

  afterAll(async () => {
    await con.disconnect()
    await mongoServer.stop()
  })

  beforeEach(async () => {
    await User.deleteMany({})
    process.env.ADMIN_USERNAME = 'admin'
  })

  it('creates the admin when ADMIN_PASSWORD_INITIAL is set', async () => {
    process.env.ADMIN_PASSWORD_INITIAL = 'a-valid-initial-password'

    await seedDB()

    const admin = await User.findOne({ username: 'admin' })
    expect(admin).not.toBeNull()
    expect(admin!.isAdmin).toEqual(true)
    expect(admin!.isActive).toEqual(true)
  })

  it('seeds no admin when ADMIN_PASSWORD_INITIAL is an empty string', async () => {
    // verifyEnvVariables normalises an unset password to '' when an external
    // provider is enabled - that is the fresh-install state.
    process.env.ADMIN_PASSWORD_INITIAL = ''

    await seedDB()

    expect(await User.findOne({ isAdmin: true })).toBeNull()
    expect(await User.countDocuments({})).toEqual(0)
  })

  it('seeds no admin when ADMIN_PASSWORD_INITIAL is unset', async () => {
    delete process.env.ADMIN_PASSWORD_INITIAL

    await seedDB()

    // No account at all - in particular none whose password is the string
    // 'undefined', which is what hashing an absent value used to produce.
    expect(await User.countDocuments({})).toEqual(0)
  })
})
