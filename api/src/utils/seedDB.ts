import Client from '../model/Client'
import Group, { PUBLIC_GROUP_NAME } from '../model/Group'
import User from '../model/User'
import Configuration, { ConfigurationType } from '../model/Configuration'

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

    console.log(`DB Seed - client created: ${CLIENT.clientId}`)
  }

  // Checking if 'AllUsers' Group is already in the database
  let groupExist = await Group.findOne({ name: GROUP.name })
  if (!groupExist) {
    const group = new Group(GROUP)
    groupExist = await group.save()

    console.log(`DB Seed - Group created: ${GROUP.name}`)
  }

  // Checking if 'Public' Group is already in the database
  const publicGroupExist = await Group.findOne({ name: PUBLIC_GROUP.name })
  if (!publicGroupExist) {
    const group = new Group(PUBLIC_GROUP)
    await group.save()

    console.log(`DB Seed - Group created: ${PUBLIC_GROUP.name}`)
  }

  // Checking if user is already in the database
  let usernameExist = await User.findOne({ username: ADMIN_USER.username })
  if (!usernameExist) {
    const user = new User(ADMIN_USER)
    usernameExist = await user.save()

    console.log(`DB Seed - admin account created: ${ADMIN_USER.username}`)
  }

  if (!groupExist.hasUser(usernameExist)) {
    groupExist.addUser(usernameExist)
    console.log(
      `DB Seed - admin account '${ADMIN_USER.username}' added to Group '${GROUP.name}'`
    )
  }

  // checking if configuration is present in the database
  let configExist = await Configuration.findOne()
  if (!configExist) {
    const configuration = new Configuration(SECRETS)
    configExist = await configuration.save()

    console.log('DB Seed - configuration added')
  }

  return {
    ACCESS_TOKEN_SECRET: configExist.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: configExist.REFRESH_TOKEN_SECRET,
    AUTH_CODE_SECRET: configExist.AUTH_CODE_SECRET,
    SESSION_SECRET: configExist.SESSION_SECRET
  }
}

const GROUP = {
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
const ADMIN_USER = {
  id: 1,
  displayName: 'Super Admin',
  username: 'secretuser',
  password: '$2a$10$hKvcVEZdhEQZCcxt6npazO6mY4jJkrzWvfQ5stdBZi8VTTwVMCVXO',
  isAdmin: true,
  isActive: true
}
