import mongoose, { Schema } from 'mongoose'

export const NUMBER_OF_SECONDS_IN_A_DAY = 86400
export interface ClientPayload {
  /**
   * Client ID
   * @example "someFormattedClientID1234"
   */
  clientId: string
  /**
   * Client Secret
   * @example "someRandomCryptoString"
   */
  clientSecret: string
  /**
   * Number of seconds after which access token will expire
   * @example 86400
   */
  accessTokenExpiration?: number
  /**
   * Number of days after which access token will expire
   * @example 2592000
   */
  refreshTokenExpiration?: number
}

const ClientSchema = new Schema<ClientPayload>({
  clientId: {
    type: String,
    required: true
  },
  clientSecret: {
    type: String,
    required: true
  },
  accessTokenExpiration: {
    type: Number,
    default: NUMBER_OF_SECONDS_IN_A_DAY
  },
  refreshTokenExpiration: {
    type: Number,
    default: NUMBER_OF_SECONDS_IN_A_DAY * 30
  }
})

export default mongoose.model('Client', ClientSchema)
