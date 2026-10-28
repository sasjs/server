import { createFolder, folderExists } from '@sasjs/utils'

import { resolveWithinDrive } from './resolveWithinDrive'
import { userHomeFolderFor } from './userHomePath'

/**
 * The routes a user needs for their own home folder: list it, read and write
 * files in it, and rename entries.
 *
 * Permissions in this server are per ROUTE, not per path, so a grant on these
 * four is what makes `/home/<username>` usable - it also admits the rest of the
 * drive. That is the current permission model, not a choice made here; a
 * path-scoped ACL would be the way to narrow it.
 *
 * `/SASjsApi/code/execute` is deliberately NOT included: running submitted code
 * is a privilege an administrator grants on purpose, and it is not part of
 * having a folder.
 */
export const USER_HOME_ROUTES = [
  '/SASjsApi/drive/fileTree',
  '/SASjsApi/drive/file',
  '/SASjsApi/drive/folder',
  '/SASjsApi/drive/rename'
]

/** The seeded group every account belongs to. */
const ALL_USERS_GROUP_NAME = 'all-users'

/**
 * The all-users group, created if the seed has not run yet.
 *
 * The grant lives on this group, so an account created before the seed (a
 * fresh database, or a spec that never seeds) still has somewhere to be added:
 * returning early here left such an account with no membership and no way to
 * reach the folder that had just been made for it.
 */
const ensureAllUsersGroup = async () => {
  const { default: Group } = await import('../model/Group')

  return (
    (await Group.findOne({ name: ALL_USERS_GROUP_NAME })) ??
    (await new Group({
      name: ALL_USERS_GROUP_NAME,
      description: 'Group contains all users'
    }).save())
  )
}

export interface HomeProvisioning {
  /** The drive path of the home folder, or '' when the name cannot be used. */
  folderPath: string
  folderCreated: boolean
  /** Routes granted by this call (empty when they already were). */
  granted: string[]
}

/**
 * Creates a user's home folder on the drive, if it is not there yet.
 *
 * Idempotent: an existing folder is left alone and reported as not created.
 * Returns '' for the path when the username cannot be turned into a safe
 * segment, rather than throwing - a name that cannot have a home is a caller
 * problem to report, not a reason to fail an account creation.
 */
export const ensureUserHomeFolder = async (
  username: string
): Promise<Pick<HomeProvisioning, 'folderPath' | 'folderCreated'>> => {
  const folderPath = userHomeFolderFor(username)

  if (!folderPath) return { folderPath: '', folderCreated: false }

  const folderPathFull = resolveWithinDrive(folderPath)

  if (!folderPathFull) return { folderPath: '', folderCreated: false }

  if (await folderExists(folderPathFull))
    return { folderPath, folderCreated: false }

  await createFolder(folderPathFull)

  return { folderPath, folderCreated: true }
}

/**
 * Grants the drive routes to the seeded all-users group, once.
 *
 * A group rule rather than a rule per account: the grant is a statement about
 * every user having a home, so it belongs in one record per route. It also
 * leaves per-user grants free for an administrator to narrow or add to, and
 * keeps a user created at runtime covered without another write.
 *
 * Written straight to the Permission collection rather than through the
 * permission controller: that controller creates one rule at a time from an
 * admin request and throws on a duplicate, which is the normal case for a
 * repeat run.
 */
const ensureBaselineDriveGrants = async (): Promise<string[]> => {
  const { default: Permission } = await import('../model/Permission')

  const group = await ensureAllUsersGroup()

  const granted: string[] = []

  for (const route of USER_HOME_ROUTES) {
    const existing = await Permission.findOne({
      path: route,
      type: 'Route',
      group: group._id
    })

    if (existing) continue

    await new Permission({
      path: route,
      type: 'Route',
      setting: 'Grant',
      group: group._id
    }).save()

    granted.push(route)
  }

  return granted
}

/** Puts the account in the all-users group, which is where the grant lands. */
const ensureGroupMembership = async (userId: unknown): Promise<void> => {
  const { default: Group } = await import('../model/Group')
  const { default: User } = await import('../model/User')

  // Find, never create: the seed owns the all-users group, and a database
  // without one is a database that has not been seeded yet - the account has
  // no membership to be given, and inventing the group here would make
  // account creation depend on the seed's timing.
  const group = await Group.findOne({ name: ALL_USERS_GROUP_NAME })
  if (!group) return

  const user = await User.findOne({ _id: userId })

  if (!user || group.hasUser(user)) return

  // The model method, not a push: membership has to land on both sides -
  // `group.users` and `user.groups` - because the route rules are read from
  // the user document.
  await group.addUser(user)
  await group.save()
}

/**
 * Everything an account needs for its home folder: the folder itself and
 * membership of the group that carries the drive grants.
 */
export const provisionUserHome = async (user: {
  _id: unknown
  username: string
  isAdmin?: boolean
}): Promise<HomeProvisioning> => {
  const { folderPath, folderCreated } = await ensureUserHomeFolder(
    user.username
  )

  if (!folderPath) return { folderPath, folderCreated, granted: [] }

  // Admins bypass the rules, so they need no grant - but the folder is still
  // where Studio opens for them, so it is created either way.
  if (!user.isAdmin) await ensureGroupMembership(user._id)

  return { folderPath, folderCreated, granted: [] }
}

/**
 * The startup pass: the baseline grants, then a home for every active
 * non-admin account.
 *
 * Runs at boot so accounts that predate this provisioning get the same home a
 * new one is given, and so the drive grants land in one place rather than once
 * per account. Idempotent and best effort per user: one unusable username must
 * not stop the pass, and a drive that cannot be written leaves the rest of the
 * boot alone.
 */
export const provisionAllUserHomes = async (): Promise<{
  users: number
  folders: number
  grants: number
}> => {
  const { default: mongoose } = await import('mongoose')

  // Nothing to provision against without a database: the app is built (and
  // specs import it) before any connection exists, and a query then sits in
  // mongoose's buffer for its full timeout.
  if (mongoose.connection.readyState !== 1)
    return { users: 0, folders: 0, grants: 0 }

  const { default: User } = await import('../model/User')

  const granted = await ensureBaselineDriveGrants()

  const users = await User.find({ isAdmin: false, isActive: true }).select(
    '_id username isAdmin'
  )

  let folders = 0

  for (const user of users) {
    try {
      const result = await provisionUserHome({
        _id: user._id,
        username: user.username,
        isAdmin: user.isAdmin
      })

      if (result.folderCreated) folders++
    } catch (err) {
      console.log(
        `[warn] could not provision a home folder for ${user.username}:`,
        err instanceof Error ? err.message : err
      )
    }
  }

  return { users: users.length, folders, grants: granted.length }
}
