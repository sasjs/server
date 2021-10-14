import { AuthMechanism } from '../types'

export const getAuthMechanisms = () => {
  const authsMechanisms =
    process.env.AUTH?.split(' ').filter((auth) => !!auth) ?? []

  return authsMechanisms.length ? authsMechanisms : [AuthMechanism.NoSecurity]
}
