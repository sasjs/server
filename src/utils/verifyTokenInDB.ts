import User from '../model/User'

export const verifyTokenInDB = async (
  username: string,
  client_id: string,
  token: string
) => {
  const dbUser = await User.findOne({ username })

  const currentTokenObj = dbUser.tokens.find(
    (tokenObj: any) => tokenObj.clientid === client_id
  )

  return currentTokenObj?.accesstoken === token
    ? {
        client_id,
        username,
        isadmin: dbUser.isadmin,
        isactive: dbUser.isactive
      }
    : undefined
}
