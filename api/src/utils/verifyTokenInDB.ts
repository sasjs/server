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
