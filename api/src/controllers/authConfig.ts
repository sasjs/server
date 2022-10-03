import express from 'express'
import { Security, Route, Tags, Get, Post, Example } from 'tsoa'

import { LDAPClient, LDAPUser, LDAPGroup, AuthProviderType } from '../utils'
import { randomBytes } from 'crypto'
import User from '../model/User'
import Group from '../model/Group'
import Permission from '../model/Permission'

@Security('bearerAuth')
@Route('SASjsApi/authConfig')
@Tags('Auth_Config')
export class AuthConfigController {
  /**
   * @summary Gives the detail of Auth Mechanism.
   *
   */
  @Example({
    ldap: {
      LDAP_URL: 'ldaps://my.ldap.server:636',
      LDAP_BIND_DN: 'cn=admin,ou=system,dc=cloudron',
      LDAP_BIND_PASSWORD: 'secret',
      LDAP_USERS_BASE_DN: 'ou=users,dc=cloudron',
      LDAP_GROUPS_BASE_DN: 'ou=groups,dc=cloudron'
    }
  })
  @Get('/')
  public getDetail() {
    return getAuthConfigDetail()
  }

  /**
   * @summary Synchronizes LDAP users and groups with internal DB and returns the count of imported users and groups.
   *
   */
  @Example({
    users: 5,
    groups: 3
  })
  @Post('/synchronizeWithLDAP')
  public async synchronizeWithLDAP() {
    return synchronizeWithLDAP()
  }
}

const synchronizeWithLDAP = async () => {
  process.logger.info('Syncing LDAP with internal DB')

  const permissions = await Permission.get({})
  await Permission.deleteMany()
  await User.deleteMany({ authProvider: AuthProviderType.LDAP })
  await Group.deleteMany({ authProvider: AuthProviderType.LDAP })

  const ldapClient = await LDAPClient.init()

  process.logger.info('fetching LDAP users')
  const users = await ldapClient.getAllLDAPUsers()

  process.logger.info('inserting LDAP users to DB')

  const existingUsers: string[] = []
  const importedUsers: LDAPUser[] = []

  for (const user of users) {
    const usernameExists = await User.findOne({ username: user.username })
    if (usernameExists) {
      existingUsers.push(user.username)
      continue
    }

    const hashPassword = User.hashPassword(randomBytes(64).toString('hex'))

    await User.create({
      displayName: user.displayName,
      username: user.username,
      password: hashPassword,
      authProvider: AuthProviderType.LDAP
    })

    importedUsers.push(user)
  }

  if (existingUsers.length > 0) {
    process.logger.info(
      'Failed to insert following users as they already exist in DB:'
    )
    existingUsers.forEach((user) => process.logger.log(`* ${user}`))
  }

  process.logger.info('fetching LDAP groups')
  const groups = await ldapClient.getAllLDAPGroups()

  process.logger.info('inserting LDAP groups to DB')

  const existingGroups: string[] = []
  const importedGroups: LDAPGroup[] = []

  for (const group of groups) {
    const groupExists = await Group.findOne({ name: group.name })
    if (groupExists) {
      existingGroups.push(group.name)
      continue
    }

    await Group.create({
      name: group.name,
      authProvider: AuthProviderType.LDAP
    })

    importedGroups.push(group)
  }

  if (existingGroups.length > 0) {
    process.logger.info(
      'Failed to insert following groups as they already exist in DB:'
    )
    existingGroups.forEach((group) => process.logger.log(`* ${group}`))
  }

  process.logger.info('associating users and groups')

  for (const group of importedGroups) {
    const dbGroup = await Group.findOne({ name: group.name })
    if (dbGroup) {
      for (const member of group.members) {
        const user = importedUsers.find((user) => user.uid === member)
        if (user) {
          const dbUser = await User.findOne({ username: user.username })
          if (dbUser) await dbGroup.addUser(dbUser)
        }
      }
    }
  }

  process.logger.info('setting permissions')

  for (const permission of permissions) {
    const newPermission = new Permission({
      path: permission.path,
      type: permission.type,
      setting: permission.setting
    })

    if (permission.user) {
      const dbUser = await User.findOne({ username: permission.user.username })
      if (dbUser) newPermission.user = dbUser._id
    } else if (permission.group) {
      const dbGroup = await Group.findOne({ name: permission.group.name })
      if (dbGroup) newPermission.group = dbGroup._id
    }
    await newPermission.save()
  }

  process.logger.info('LDAP synchronization completed!')

  return {
    userCount: importedUsers.length,
    groupCount: importedGroups.length
  }
}

const getAuthConfigDetail = () => {
  const { AUTH_PROVIDERS } = process.env

  const returnObj: any = {}

  if (AUTH_PROVIDERS === AuthProviderType.LDAP) {
    const {
      LDAP_URL,
      LDAP_BIND_DN,
      LDAP_BIND_PASSWORD,
      LDAP_USERS_BASE_DN,
      LDAP_GROUPS_BASE_DN
    } = process.env

    returnObj.ldap = {
      LDAP_URL: LDAP_URL ?? '',
      LDAP_BIND_DN: LDAP_BIND_DN ?? '',
      LDAP_BIND_PASSWORD: LDAP_BIND_PASSWORD ?? '',
      LDAP_USERS_BASE_DN: LDAP_USERS_BASE_DN ?? '',
      LDAP_GROUPS_BASE_DN: LDAP_GROUPS_BASE_DN ?? ''
    }
  }
  return returnObj
}
