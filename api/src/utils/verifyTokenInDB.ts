import User from '../model/User'

export const verifyTokenInDB = async (
  userId: number,
  clientId: string,
  token: string,
  tokenType: 'accessToken' | 'refreshToken'
) => {
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
        isActive: dbUser.isActive
      }
    : undefined
}
