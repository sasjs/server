import { randomBytes } from 'crypto'
import User, { IUser } from '../model/User'
import { AuthProviderType } from './verifyEnvVariables'
import { OIDCIdentity } from './oidcClient'
import { sanitiseDisplayName } from './programVariables'

/**
 * sasjs usernames are constrained to lowercase alphanumerics, 3-16 characters
 * (see usernameSchema in utils/validation.ts). An identity provider's
 * preferred_username is frequently an email address, which fits none of that,
 * so the claim has to be projected onto the local rules.
 *
 * This is deliberately lossy and can therefore collide - `resolveOidcUser`
 * treats a collision as a hard failure rather than resolving it silently.
 */
export const normaliseUsername = (raw: string): string =>
  raw
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 16)

export const MIN_USERNAME_LENGTH = 3

/**
 * The two provider groups that decide access, by fixed name.
 *
 * Membership is the whole access decision, so the names are constants rather
 * than configuration: a deployment that could rename them could silently
 * change who is allowed in, and the app is the last gate once the platform's
 * login wall is out of the way.
 */
export const SASJS_ADMINS_GROUP = 'sasjs-admins'
export const SASJS_USERS_GROUP = 'sasjs-users'

export interface GroupPolicy {
  /** False refuses the sign-in outright. */
  allowed: boolean
  /** True for a member of the administrators group. */
  isAdmin: boolean
}

/**
 * What a provider's group memberships grant: nothing at all, ordinary access,
 * or administrator access. Membership of neither group is a refusal rather
 * than a quiet demotion, so a user who was removed from both is told why.
 */
export const groupPolicyFor = (groups: string[]): GroupPolicy => {
  const isAdmin = groups.includes(SASJS_ADMINS_GROUP)

  return {
    allowed: isAdmin || groups.includes(SASJS_USERS_GROUP),
    isAdmin
  }
}

/**
 * Thrown in the shape the route layer already understands: a non-Error object
 * carrying `code` and `message` becomes that status and body (see the catch in
 * routes/web/web.ts). Consistent with how `login` reports its failures.
 */
export interface OidcUserError {
  code: number
  message: string
}

const refuse = (message: string): OidcUserError => ({ code: 403, message })

export interface OidcUserResolution {
  user: IUser
  /** True when this login created the account rather than finding it. */
  provisioned: boolean
}

/**
 * Maps an asserted OIDC identity onto a local user, creating one if policy
 * allows.
 *
 * Resolution order matters:
 *
 * 1. By `authProviderId` (the `sub` claim) - the durable identity. Matched
 *    first so that a change in the normalised username cannot orphan an
 *    account or, worse, land a different subject on it.
 * 2. By the normalised username. If that finds an account, the login FAILS.
 *    It must not be silently adopted: an account with a local password may be
 *    an administrator, and claiming it on the strength of a matching username
 *    would be a privilege escalation. An admin has to resolve the clash
 *    deliberately.
 * 3. Otherwise, provision - but only when OIDC_JIT_PROVISION is true.
 *
 * Access and administration come from the provider's groups, when the provider
 * supplies them (`enforceGroupPolicy`): a member of `sasjs-admins` is an
 * administrator, a member of `sasjs-users` is an ordinary user, and a member
 * of neither is refused. The memberships are re-read on every sign-in, so
 * removing someone from the administrators group demotes them at their next
 * sign-in rather than leaving the elevation in place.
 *
 * Providers that cannot express groups are exempt, and for them the bootstrap
 * rule still applies: the first provisioned user becomes an admin while no
 * admin exists at all. Refusing every user of such a provider would be worse
 * than the bootstrap, which only ever grants one account.
 */
export const resolveOidcUser = async (
  identity: OIDCIdentity,
  enforceGroupPolicy: boolean
): Promise<OidcUserResolution> => {
  const policy = enforceGroupPolicy
    ? groupPolicyFor(identity.groups)
    : undefined

  if (policy && !policy.allowed) {
    throw refuse(
      `Your account is not a member of '${SASJS_USERS_GROUP}' or '${SASJS_ADMINS_GROUP}', which this server requires for access. Ask an administrator to add you to one of them.`
    )
  }

  const existingBySubject = await User.findOne({
    authProvider: AuthProviderType.OIDC,
    authProviderId: identity.subject
  })

  if (existingBySubject) {
    if (!existingBySubject.isActive) {
      throw refuse('Your account is not active.')
    }

    // The provider's groups are the source of truth for administration, so a
    // membership change takes effect at the next sign-in.
    if (policy && existingBySubject.isAdmin !== policy.isAdmin) {
      process.logger?.info(
        `OIDC user '${existingBySubject.username}' ${
          policy.isAdmin ? 'promoted to' : 'demoted from'
        } administrator by group membership`
      )

      existingBySubject.isAdmin = policy.isAdmin
      await existingBySubject.save()
    }

    return { user: existingBySubject, provisioned: false }
  }

  const username = normaliseUsername(identity.username)

  if (username.length < MIN_USERNAME_LENGTH) {
    throw refuse(
      `The username asserted by the identity provider ('${identity.username}') does not contain enough alphanumeric characters to form a valid SASjs username (minimum ${MIN_USERNAME_LENGTH}).`
    )
  }

  const existingByUsername = await User.findOne({ username })

  if (existingByUsername) {
    // Never adopt an existing account, and never fail silently.
    throw refuse(
      `A user named '${username}' already exists and is not linked to this identity provider account. An administrator must resolve this before you can sign in.`
    )
  }

  if (process.env.OIDC_JIT_PROVISION !== 'true') {
    throw refuse(
      `No account exists for '${username}' and automatic provisioning is disabled.`
    )
  }

  const adminExists = await User.findOne({ isAdmin: true })

  // With the group policy in force the group decides; without it (a provider
  // that cannot express groups) the first user bootstraps the install.
  const isAdmin = policy ? policy.isAdmin : !adminExists

  process.logger?.info(
    `Provisioning OIDC user '${username}'${
      isAdmin
        ? policy
          ? ` as an administrator (member of '${SASJS_ADMINS_GROUP}')`
          : ' as the first administrator'
        : ''
    }`
  )

  const user = await User.create({
    displayName: sanitiseDisplayName(identity.displayName),
    username,
    // No usable local password: the provider is the only way in. Password
    // login for a provider-backed user is refused by the login route, and
    // updatePassword refuses to change it (controllers/auth.ts).
    password: User.hashPassword(randomBytes(64).toString('hex')),
    authProvider: AuthProviderType.OIDC,
    authProviderId: identity.subject,
    isAdmin,
    isActive: true,
    needsToUpdatePassword: false
  })

  return { user, provisioned: true }
}
