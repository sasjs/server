import jwt from 'jsonwebtoken'
import User from '../model/User'

const isValidToken = async (
  token: string,
  key: string,
  userId: number,
  clientId: string
) => {
  const promise = new Promise<boolean>((resolve, reject) =>
    jwt.verify(token, key, (err, decoded) => {
      if (err) return reject(false)

      if (decoded?.userId === userId && decoded?.clientId === clientId) {
        return resolve(true)
      }

      return reject(false)
    })
  )

  return await promise.then(() => true).catch(() => false)
}

export const getTokensFromDB = async (userId: number, clientId: string) => {
  const user = await User.findOne({ id: userId })
  if (!user) return

  const currentTokenObj = user.tokens.find(
    (tokenObj: any) => tokenObj.clientId === clientId
  )

  if (currentTokenObj) {
    const accessToken = currentTokenObj.accessToken
    const refreshToken = currentTokenObj.refreshToken

    const isValidAccessToken = await isValidToken(
      accessToken,
      process.secrets.ACCESS_TOKEN_SECRET,
      userId,
      clientId
    )

    const isValidRefreshToken = await isValidToken(
      refreshToken,
      process.secrets.REFRESH_TOKEN_SECRET,
      userId,
      clientId
    )

    if (isValidAccessToken && isValidRefreshToken) {
      return { accessToken, refreshToken }
    }
  }
}
