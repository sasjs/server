import bcrypt from 'bcryptjs'
import Client from '../model/Client'
import Group, { PUBLIC_GROUP_NAME } from '../model/Group'
import User, { IUserDocument } from '../model/User'
import Configuration, { ConfigurationType } from '../model/Configuration'
import { ResetAdminPasswordType } from './verifyEnvVariables'

import { randomBytes } from 'crypto'

export const SECRETS: ConfigurationType = {
  ACCESS_TOKEN_SECRET: randomBytes(64).toString('hex'),
  REFRESH_TOKEN_SECRET: randomBytes(64).toString('hex'),
  AUTH_CODE_SECRET: randomBytes(64).toString('hex'),
  SESSION_SECRET: randomBytes(64).toString('hex')
}

export const seedDB = async (): Promise<ConfigurationType> => {
  // Checking if client is already in the database
  const clientExist = await Client.findOne({ clientId: CLIENT.clientId })
  if (!clientExist) {
    const client = new Client(CLIENT)
    await client.save()

    process.logger.success(`DB Seed - client created: ${CLIENT.clientId}`)
  }

  // Checking if 'all-users' Group is already in the database
  let groupExist = await Group.findOne({ name: ALL_USERS_GROUP.name })
  if (!groupExist) {
    const group = new Group(ALL_USERS_GROUP)
    groupExist = await group.save()

    process.logger.success(`DB Seed - Group created: ${ALL_USERS_GROUP.name}`)
  }

  // Checking if 'public' Group is already in the database
  const publicGroupExist = await Group.findOne({ name: PUBLIC_GROUP.name })
  if (!publicGroupExist) {
    const group = new Group(PUBLIC_GROUP)
    await group.save()

    process.logger.success(`DB Seed - Group created: ${PUBLIC_GROUP.name}`)
  }

  // The local admin is seeded ONLY when the operator supplied a password for
  // it. Without one there is no local admin, and the first user to
  // authenticate through an external provider becomes the administrator
  // (resolveOidcUser) - which is what makes a fresh install usable without a
  // credential nobody can read. verifyEnvVariables guarantees that in server
  // mode this state is only reachable when an external provider is enabled.
  const ADMIN_USER = getAdminUser()

  if (!ADMIN_USER) {
    process.logger.info(
      'DB Seed - ADMIN_PASSWORD_INITIAL is not set, so no local admin is seeded. The first user to sign in through the configured auth provider becomes the administrator.'
    )
  } else {
    // Checking if user is already in the database
    let usernameExist = await User.findOne({ username: ADMIN_USER.username })
    if (usernameExist) {
      usernameExist = await resetAdminPassword(
        usernameExist,
        ADMIN_USER.password
      )
    } else {
      const user = new User(ADMIN_USER)
      usernameExist = await user.save()

      process.logger.success(
        `DB Seed - admin account created: ${ADMIN_USER.username}`
      )
    }

    if (usernameExist.isAdmin && !groupExist.hasUser(usernameExist)) {
      groupExist.addUser(usernameExist)
      process.logger.success(
        `DB Seed - admin account '${ADMIN_USER.username}' added to Group '${ALL_USERS_GROUP.name}'`
      )
    }
  }

  // checking if configuration is present in the database
  let configExist = await Configuration.findOne()
  if (!configExist) {
    const configuration = new Configuration(SECRETS)
    configExist = await configuration.save()

    process.logger.success('DB Seed - configuration added')
  }

  return {
    ACCESS_TOKEN_SECRET: configExist.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: configExist.REFRESH_TOKEN_SECRET,
    AUTH_CODE_SECRET: configExist.AUTH_CODE_SECRET,
    SESSION_SECRET: configExist.SESSION_SECRET
  }
}

export const ALL_USERS_GROUP = {
  name: 'all-users',
  description: 'Group contains all users'
}

const PUBLIC_GROUP = {
  name: PUBLIC_GROUP_NAME,
  description:
    'A special group that can be used to bypass authentication for particular routes.'
}

const CLIENT = {
  clientId: 'clientID1',
  clientSecret: 'clientSecret'
}

const getAdminUser = () => {
  const { ADMIN_USERNAME, ADMIN_PASSWORD_INITIAL } = process.env

  // No password configured means no local admin at all - see the note at the
  // call site. Hashing an absent value would otherwise create an account whose
  // password is the literal string 'undefined'.
  if (!ADMIN_PASSWORD_INITIAL) return undefined

  const salt = bcrypt.genSaltSync(10)
  const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD_INITIAL, salt)

  return {
    displayName: 'Super Admin',
    username: ADMIN_USERNAME,
    password: hashedPassword,
    isAdmin: true,
    isActive: true
  }
}

const resetAdminPassword = async (
  user: IUserDocument,
  password: string
): Promise<IUserDocument> => {
  const { ADMIN_PASSWORD_RESET } = process.env

  if (ADMIN_PASSWORD_RESET === ResetAdminPasswordType.YES) {
    if (!user.isAdmin) {
      process.logger.error(
        `Can not reset the password of non-admin user (${user.username}) on startup.`
      )

      return user
    }

    if (user.authProvider) {
      process.logger.error(
        `Can not reset the password of admin (${user.username}) with ${user.authProvider} as authentication mechanism.`
      )

      return user
    }

    process.logger.info(
      `DB Seed - resetting password for admin user: ${user.username}`
    )

    user.password = password
    user.needsToUpdatePassword = true
    user = await user.save()

    process.logger.success(`DB Seed - successfully reset the password`)
  }

  return user
}
