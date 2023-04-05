import bcrypt from 'bcryptjs'
import Client from '../model/Client'
import Group, { PUBLIC_GROUP_NAME } from '../model/Group'
import User, { IUser } from '../model/User'
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

  // Checking if 'AllUsers' Group is already in the database
  let groupExist = await Group.findOne({ name: ALL_USERS_GROUP.name })
  if (!groupExist) {
    const group = new Group(ALL_USERS_GROUP)
    groupExist = await group.save()

    process.logger.success(`DB Seed - Group created: ${ALL_USERS_GROUP.name}`)
  }

  // Checking if 'Public' Group is already in the database
  const publicGroupExist = await Group.findOne({ name: PUBLIC_GROUP.name })
  if (!publicGroupExist) {
    const group = new Group(PUBLIC_GROUP)
    await group.save()

    process.logger.success(`DB Seed - Group created: ${PUBLIC_GROUP.name}`)
  }

  const ADMIN_USER = getAdminUser()

  // Checking if user is already in the database
  let usernameExist = await User.findOne({ username: ADMIN_USER.username })
  if (usernameExist) {
    usernameExist = await resetAdminPassword(usernameExist, ADMIN_USER.password)
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
  name: 'AllUsers',
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

  const salt = bcrypt.genSaltSync(10)
  const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD_INITIAL as string, salt)

  return {
    displayName: 'Super Admin',
    username: ADMIN_USERNAME,
    password: hashedPassword,
    isAdmin: true,
    isActive: true
  }
}

const resetAdminPassword = async (user: IUser, password: string) => {
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
