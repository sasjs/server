import User from '../model/User'
import { RequestUser } from '../types'

export const fetchLatestAutoExec = async (
  reqUser: RequestUser
): Promise<RequestUser | undefined> => {
  const dbUser = await User.findOne({ id: reqUser.userId })

  if (!dbUser) return undefined

  return {
    userId: reqUser.userId,
    clientId: reqUser.clientId,
    username: dbUser.username,
    displayName: dbUser.displayName,
    isAdmin: dbUser.isAdmin,
    isActive: dbUser.isActive,
    needsToUpdatePassword: dbUser.needsToUpdatePassword,
    autoExec: dbUser.autoExec
  }
}

// Access/refresh tokens are JWTs, so they're self-verifying - but that
// alone would make them impossible to revoke before expiry. Requiring the
// exact token string to still be the one stored on the user's tokens array
// (written by saveTokensInDB, cleared by removeTokensInDB) turns them into
// revocable credentials: logout, or issuing a fresh pair via /auth/refresh,
// immediately invalidates the old token even though its signature is still
// valid.
export const verifyTokenInDB = async (
  userId: number,
  clientId: string,
  token: string,
  tokenType: 'accessToken' | 'refreshToken'
): Promise<RequestUser | undefined> => {
  const dbUser = await User.findOne({ id: userId })

  if (!dbUser) return undefined

  const currentTokenObj = dbUser.tokens.find(
    (tokenObj: any) => tokenObj.clientId === clientId
  )

  return currentTokenObj?.[tokenType] === token
    ? {
        userId: dbUser.id,
        clientId,
        username: dbUser.username,
        displayName: dbUser.displayName,
        isAdmin: dbUser.isAdmin,
        isActive: dbUser.isActive,
        needsToUpdatePassword: dbUser.needsToUpdatePassword,
        autoExec: dbUser.autoExec
      }
    : undefined
}
