import User from '../model/User'

export const saveTokensInDB = async (
  username: string,
  client_id: string,
  accessToken: string,
  refreshToken: string
) => {
  const user = await User.findOne({ username })

  const currentTokenObj = user.tokens.find(
    (tokenObj: any) => tokenObj.clientid === client_id
  )
  if (currentTokenObj) {
    currentTokenObj.accesstoken = accessToken
    currentTokenObj.refreshtoken = refreshToken
  } else {
    user.tokens.push({
      clientid: client_id,
      accesstoken: accessToken,
      refreshtoken: refreshToken
    })
  }
  await user.save()
}
