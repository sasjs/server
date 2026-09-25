import { randomBytes } from 'crypto'
import User, { IUser } from '../model/User'
import { AuthProviderType } from './verifyEnvVariables'
import { OIDCIdentity } from './oidcClient'

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
 * Bootstrap rule: the first provisioned user becomes an admin only while no
 * admin exists at all. After that every provisioned user is a normal user.
 * This keeps a fresh install usable without granting admin to everyone who
 * can reach the login page.
 */
export const resolveOidcUser = async (
  identity: OIDCIdentity
): Promise<OidcUserResolution> => {
  const existingBySubject = await User.findOne({
    authProvider: AuthProviderType.OIDC,
    authProviderId: identity.subject
  })

  if (existingBySubject) {
    if (!existingBySubject.isActive) {
      throw refuse('Your account is not active.')
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

  process.logger?.info(
    `Provisioning OIDC user '${username}'${
      adminExists ? '' : ' as the first administrator'
    }`
  )

  const user = await User.create({
    displayName: identity.displayName,
    username,
    // No usable local password: the provider is the only way in. Password
    // login for a provider-backed user is refused by the login route, and
    // updatePassword refuses to change it (controllers/auth.ts).
    password: User.hashPassword(randomBytes(64).toString('hex')),
    authProvider: AuthProviderType.OIDC,
    authProviderId: identity.subject,
    isAdmin: !adminExists,
    isActive: true,
    needsToUpdatePassword: false
  })

  return { user, provisioned: true }
}
