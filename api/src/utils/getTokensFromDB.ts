import jwt from 'jsonwebtoken'
import User from '../model/User'

export const getTokensFromDB = async (userId: number, clientId: string) => {
  const user = await User.findOne({ id: userId })
  if (!user) return

  const currentTokenObj = user.tokens.find(
    (tokenObj: any) => tokenObj.clientId === clientId
  )

  if (currentTokenObj) {
    const accessToken = currentTokenObj.accessToken
    const refreshToken = currentTokenObj.refreshToken

    const verifiedAccessToken: any = jwt.verify(
      accessToken,
      process.secrets.ACCESS_TOKEN_SECRET
    )

    const verifiedRefreshToken: any = jwt.verify(
      refreshToken,
      process.secrets.REFRESH_TOKEN_SECRET
    )

    if (
      verifiedAccessToken?.userId !== userId ||
      verifiedAccessToken?.clientId !== clientId
    )
      return

    if (
      verifiedRefreshToken?.userId !== userId ||
      verifiedRefreshToken?.clientId !== clientId
    )
      return

    return { accessToken, refreshToken }
  }
}
