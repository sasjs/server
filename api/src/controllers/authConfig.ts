import { Security, Route, Tags, Get, Post, Example, Response } from 'tsoa'
import {
  createAuthConfigService,
  createDirectoryService,
  type AuthConfig,
  type AuthConfigResponse,
  type DirectorySource
} from '@sasjs/api'

import { LDAPClient, AuthProviderType, isAuthProviderEnabled } from '../utils'
import { mongoDirectoryStore } from './internal/directoryStore'

@Security('bearerAuth')
@Route('SASjsApi/authConfig')
@Tags('Auth Config')
export class AuthConfigController {
  /**
   * Returns the non-secret configuration of each enabled authentication
   * provider, for display in the administration interface.
   *
   * Secrets are never echoed: for each provider the response reports only
   * whether its bind password or client secret is set (`LDAP_BIND_PASSWORD_SET`,
   * `OIDC_CLIENT_SECRET_SET`). Admin only.
   *
   * @summary Get the configured authentication providers
   */
  @Example({
    ldap: {
      LDAP_URL: 'ldaps://my.ldap.server:636',
      LDAP_BIND_DN: 'cn=admin,ou=system,dc=cloudron',
      LDAP_USERS_BASE_DN: 'ou=users,dc=cloudron',
      LDAP_GROUPS_BASE_DN: 'ou=groups,dc=cloudron',
      LDAP_BIND_PASSWORD_SET: true
    }
  })
  @Response(
    401,
    'Unauthorized, or an administrator account is required. The mount point in routes/api/index.ts applies both checks before this handler runs.'
  )
  @Response(403, 'Not Allowed while in Desktop Mode.')
  @Response(500, 'The provider configuration could not be read')
  @Get('/')
  // tsoa cannot emit a schema for a declaration it cannot see (the response type
  // lives in `@sasjs/api`), and this route's document is `{}` for that reason -
  // so the signature stays untyped here rather than failing the spec build. The
  // shape is the package's `AuthConfigResponse`, asserted by its own spec.
  public getDetail(): Promise<any> {
    return getAuthConfigDetail()
  }

  /**
   * Imports the users and groups of the configured LDAP directory into the
   * internal database and returns the number imported.
   *
   * Users and groups that already exist are left untouched. Admin only.
   *
   * @summary Import users and groups from LDAP
   */
  @Example({
    userCount: 5,
    groupCount: 3
  })
  @Response(
    401,
    'Unauthorized, or an administrator account is required. The mount point in routes/api/index.ts applies both checks before this handler runs.'
  )
  @Response(403, 'Not Allowed while in Desktop Mode.')
  @Response(500, 'The directory could not be synchronised')
  @Post('/synchroniseWithLDAP')
  public async synchroniseWithLDAP(): Promise<{
    userCount: number
    groupCount: number
  }> {
    return synchroniseWithLDAP()
  }
}

/**
 * The provider blocks this host was started with, in the package's own shape.
 *
 * Values are the environment's, so a provider that is not enabled is `undefined`
 * rather than an empty block; the secret is a boolean, never the value.
 */
const ldapProvider = (): AuthConfig['ldap'] => {
  if (!isAuthProviderEnabled(AuthProviderType.LDAP)) return undefined

  const {
    LDAP_URL,
    LDAP_BIND_DN,
    LDAP_BIND_PASSWORD,
    LDAP_USERS_BASE_DN,
    LDAP_GROUPS_BASE_DN
  } = process.env

  return {
    url: LDAP_URL ?? '',
    bindDn: LDAP_BIND_DN ?? '',
    usersBaseDn: LDAP_USERS_BASE_DN ?? '',
    groupsBaseDn: LDAP_GROUPS_BASE_DN ?? '',
    bindPasswordSet: !!LDAP_BIND_PASSWORD
  }
}

const oidcProvider = (): AuthConfig['oidc'] => {
  if (!isAuthProviderEnabled(AuthProviderType.OIDC)) return undefined

  const {
    OIDC_PROVIDER_NAME,
    OIDC_ISSUER_URL,
    OIDC_CLIENT_ID,
    OIDC_CLIENT_SECRET,
    OIDC_REDIRECT_URI,
    OIDC_SCOPE,
    OIDC_SIGNING_ALG,
    OIDC_USERNAME_CLAIM,
    OIDC_JIT_PROVISION
  } = process.env

  return {
    providerName: OIDC_PROVIDER_NAME ?? '',
    issuerUrl: OIDC_ISSUER_URL ?? '',
    clientId: OIDC_CLIENT_ID ?? '',
    redirectUri: OIDC_REDIRECT_URI ?? '',
    scope: OIDC_SCOPE ?? '',
    signingAlg: OIDC_SIGNING_ALG ?? '',
    usernameClaim: OIDC_USERNAME_CLAIM ?? '',
    jitProvision: OIDC_JIT_PROVISION ?? '',
    clientSecretSet: !!OIDC_CLIENT_SECRET
  }
}

/**
 * The rendered configuration. The redaction rule - secrets never echoed, only
 * whether one is set - and the environment key names are `@sasjs/api`'s, so the
 * administration page and a mock host read one answer.
 */
const getAuthConfigDetail = (): Promise<AuthConfigResponse> => {
  const ldap = ldapProvider()
  const oidc = oidcProvider()

  return createAuthConfigService(() => ({
    ...(ldap ? { ldap } : {}),
    ...(oidc ? { oidc } : {})
  })).authConfig()
}

/**
 * The import itself.
 *
 * The package owns the rules: a user or group that already exists is left alone,
 * what it creates is stamped with the provider, membership travels from the
 * directory's group list (which names members by directory uid, mapped here to
 * the username the API keys on), and a directory answer that names one account
 * twice is refused before anything is written.
 *
 * This replaces a delete-and-reimport that also rebuilt every permission rule:
 * with nothing deleted, a rule keeps the identifier it already names, so the sync
 * is no longer destructive and the route does what its description says.
 */
const synchroniseWithLDAP = async () => {
  process.logger.info('Syncing LDAP with internal DB')

  const client = await LDAPClient.init()
  const users = await client.getAllLDAPUsers()
  const groups = await client.getAllLDAPGroups()

  const usernameByUid = new Map(users.map((user) => [user.uid, user.username]))

  const source: DirectorySource = {
    users: async () => users,
    groups: async () =>
      groups.map((group) => ({
        name: group.name,
        // a member the directory names but did not return as a user is skipped
        // by the import, which is the package's rule for an unknown account
        members: group.members
          .map((uid) => usernameByUid.get(uid))
          .filter((username): username is string => !!username)
      }))
  }

  const result = await createDirectoryService(
    mongoDirectoryStore(),
    source
  ).synchronise()

  process.logger.info(
    `LDAP sync imported ${result.userCount} user(s) and ${result.groupCount} group(s)`
  )

  return result
}
