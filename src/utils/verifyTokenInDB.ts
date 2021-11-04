import User from '../model/User'

export const verifyTokenInDB = async (
  username: string,
  clientId: string,
  token: string,
  tokenType: 'accessToken' | 'refreshToken'
) => {
  const dbUser = await User.findOne({ username })

  if (!dbUser) return undefined

  const currentTokenObj = dbUser.tokens.find(
    (tokenObj: any) => tokenObj.clientId === clientId
  )

  return currentTokenObj?.[tokenType] === token
    ? {
        clientId,
        username,
        isAdmin: dbUser.isAdmin,
        isActive: dbUser.isActive
      }
    : undefined
}
