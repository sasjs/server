import Group, { PUBLIC_GROUP_NAME } from '../model/Group'
import { IUserDocument } from '../model/User'
import { AuthProviderType } from './verifyEnvVariables'

/**
 * The provider's groups in the form the local database stores them: trimmed,
 * de-duplicated, and with the reserved pseudo-group dropped.
 *
 * `public` names the group the permission layer treats as "everyone", and the
 * group API refuses to add or remove members of it, so a provider group
 * carrying that name is not mirrored.
 */
export const providerGroupNames = (groups: string[]): string[] => {
  const names = groups
    .filter((group): group is string => typeof group === 'string')
    .map((group) => group.trim())
    .filter((name) => name.length > 0 && name !== PUBLIC_GROUP_NAME)

  return Array.from(new Set(names))
}

export interface GroupMirrorResult {
  /** Groups the user has been added to. */
  added: string[]
  /** Groups the user has been removed from. */
  removed: string[]
  /**
   * Provider groups left alone because a group of that name exists and is not
   * managed by this provider.
   */
  skipped: string[]
}

/**
 * Mirrors the group memberships the provider asserts onto the local groups of
 * the user who is signing in.
 *
 * OpenID Connect reports the groups of the user in front of it and offers no
 * way to enumerate a directory, so this is a per-sign-in mirror rather than
 * the bulk synchronisation LDAP allows (`synchroniseWithLDAP`). Membership is
 * authoritative: a group the provider no longer asserts is removed, so a
 * revocation takes effect at the next sign-in instead of leaving the access
 * the group granted in place.
 *
 * Mirrored groups carry `authProvider: oidc`, which is what marks them as
 * provider-managed - the group API refuses hand edits to such a group, and
 * only such a group is created or removed from here.
 *
 * A group is matched by name AND by provider, so a group an administrator
 * created locally, or one another provider owns, is never adopted by a
 * provider group that happens to share its name: its members and the
 * permissions pointing at it belong to whoever created it. A name clash is
 * reported back so the caller can log it rather than resolve it silently.
 *
 * Requires the local user to exist, and is idempotent: repeated sign-ins
 * converge on the memberships the provider asserts.
 */
export const syncOidcGroups = async (
  user: IUserDocument,
  groups: string[]
): Promise<GroupMirrorResult> => {
  const names = providerGroupNames(groups)
  const result: GroupMirrorResult = { added: [], removed: [], skipped: [] }

  for (const name of names) {
    let group = await Group.findOne({
      name,
      authProvider: AuthProviderType.OIDC
    })

    if (!group) {
      const nameTaken = await Group.findOne({ name })

      if (nameTaken) {
        result.skipped.push(name)
        continue
      }

      group = await Group.create({
        name,
        authProvider: AuthProviderType.OIDC,
        description: `Members are taken from the '${name}' group of the identity provider at each sign-in.`
      })
    }

    if (group.hasUser(user)) continue

    await group.addUser(user)
    result.added.push(name)
  }

  const mirrored = await Group.find({
    authProvider: AuthProviderType.OIDC,
    users: user._id
  })

  for (const group of mirrored) {
    if (names.includes(group.name)) continue

    await group.removeUser(user)
    result.removed.push(group.name)
  }

  return result
}
