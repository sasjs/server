import type {
  DirectoryStore,
  IdentityGroupRecord,
  IdentityUserRecord,
  NewGroup,
  NewUser
} from '@sasjs/api'
import { randomBytes } from 'crypto'

import Group, { IGroupDocument } from '../../model/Group'
import User, { IUserDocument } from '../../model/User'

/**
 * The five store methods a directory import needs, over Mongoose.
 *
 * Deliberately not a `RecordService` and not an `IdentityStore`: an import
 * creates accounts and memberships, and has no business issuing tokens or
 * spending authorization codes. The package narrowed its port to these five for
 * the same reason.
 */

const userRecord = (user: IUserDocument): IdentityUserRecord => ({
  uid: user.uid,
  username: user.username,
  displayName: user.displayName,
  isAdmin: user.isAdmin,
  isActive: user.isActive,
  needsToUpdatePassword: user.needsToUpdatePassword,
  groups: (user.groups || []).map(String),
  ...(user.authProvider ? { authProvider: user.authProvider } : {})
})

const groupRecord = (group: IGroupDocument): IdentityGroupRecord => ({
  uid: group.uid,
  name: group.name,
  description: group.description,
  isActive: group.isActive,
  users: group.users.map(String),
  ...(group.authProvider ? { authProvider: group.authProvider } : {})
})

export const mongoDirectoryStore = (): DirectoryStore => ({
  users: async () => (await User.find({})).map(userRecord),

  createUser: async (input: NewUser) => {
    // a directory account authenticates against its directory, so the local
    // password is a random string nobody holds - the account cannot be signed
    // into locally, which is the intent
    const password = User.hashPassword(randomBytes(64).toString('hex'))

    const created = await User.create({
      displayName: input.displayName,
      username: input.username,
      password,
      isAdmin: input.isAdmin,
      isActive: input.isActive,
      needsToUpdatePassword: false,
      ...(input.authProvider ? { authProvider: input.authProvider } : {})
    })

    return userRecord(created)
  },

  groups: async () => (await Group.find({})).map(groupRecord),

  createGroup: async (input: NewGroup) => {
    const created = await Group.create({
      name: input.name,
      description: input.description,
      isActive: input.isActive,
      ...(input.authProvider ? { authProvider: input.authProvider } : {})
    })

    return groupRecord(created)
  },

  addToGroup: async (groupUid: string, userUid: string) => {
    const [group, user] = await Promise.all([
      Group.findById(groupUid),
      User.findById(userUid)
    ])

    if (!group || !user) return undefined

    return groupRecord(await group.addUser(user))
  }
})
