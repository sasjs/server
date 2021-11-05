import User from '../model/User'

export const removeTokensInDB = async (userId: number, clientId: string) => {
  const user = await User.findOne({ id: userId })
  if (!user) return

  const tokenObjIndex = user.tokens.findIndex(
    (tokenObj: any) => tokenObj.clientId === clientId
  )

  if (tokenObjIndex > -1) {
    user.tokens.splice(tokenObjIndex, 1)
    await user.save()
  }
}
