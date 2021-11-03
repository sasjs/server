import User from '../model/User'

export const removeTokensInDB = async (username: string, client_id: string) => {
  const user = await User.findOne({ username })

  const tokenObjIndex = user.tokens.findIndex(
    (tokenObj: any) => tokenObj.clientid === client_id
  )

  if (tokenObjIndex > -1) {
    user.tokens.splice(tokenObjIndex, 1)
    await user.save()
  }
}
