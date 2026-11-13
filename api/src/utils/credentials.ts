/**
 * The password check behind every sign-in this server performs.
 *
 * Three places take a username and a password - the browser's
 * `POST /SASLogon/login`, the estate's `password` grant, and the SAS9 mock - and
 * a credential rule that lives in only one of them is a rule the others do not
 * enforce. LDAP accounts are verified by their provider, local accounts against
 * the stored hash, and with local sign-in switched off there is no stored
 * password to compare at all.
 *
 * The refusals are the ones the browser already shows, so the two paths cannot
 * disagree about what a wrong password is.
 */
import type { IUserDocument } from '../model/User'
import User from '../model/User'
import { HttpError } from './httpError'
import {
  AuthProviderType,
  isAuthProviderEnabled,
  isLocalLoginEnabled
} from './verifyEnvVariables'
import { LDAPClient } from './ldapClient'

export const invalidPassword = () => new HttpError(401, 'Invalid Password.')
export const userNotFound = () => new HttpError(401, 'Username is not found.')
export const localLoginDisabled = () =>
  new HttpError(
    401,
    'Password sign-in is disabled for local accounts. Sign in with the configured identity provider.'
  )

/**
 * The account the credentials belong to, or the refusal they earn.
 *
 * Built where it is thrown, so the stack names the request that refused rather
 * than this module's evaluation.
 */
export const verifyCredentials = async (
  username: string,
  password: string
): Promise<IUserDocument> => {
  const user = await User.findOne({ username })

  let validPass = false

  if (user) {
    if (
      isAuthProviderEnabled(AuthProviderType.LDAP) &&
      user.authProvider === AuthProviderType.LDAP
    ) {
      const ldapClient = await LDAPClient.init()
      validPass = await ldapClient
        .verifyUser(username, password)
        .catch(() => false)
    } else if (!isLocalLoginEnabled()) {
      // The operator has switched local sign-in off, so the stored password is
      // never compared: there is no credential here to attack. Accounts that
      // authenticate through LDAP keep working, and provider accounts sign in
      // through the provider.
      throw localLoginDisabled()
    } else {
      validPass = user.comparePassword(password)
    }
  }

  if (!user) throw userNotFound()
  if (!validPass) throw invalidPassword()

  return user
}
