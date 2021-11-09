import User from '../model/User'

export const saveTokensInDB = async (
  userId: number,
  clientId: string,
  accessToken: string,
  refreshToken: string
) => {
  const user = await User.findOne({ id: userId })
  if (!user) return

  const currentTokenObj = user.tokens.find(
    (tokenObj: any) => tokenObj.clientId === clientId
  )
  if (currentTokenObj) {
    currentTokenObj.accessToken = accessToken
    currentTokenObj.refreshToken = refreshToken
  } else {
    user.tokens.push({
      clientId: clientId,
      accessToken: accessToken,
      refreshToken: refreshToken
    })
  }
  await user.save()
}
