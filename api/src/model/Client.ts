import mongoose, { Schema } from 'mongoose'

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
   * Number of days in which access token will expire
   * @example 1
   */
  accessTokenExpiryDays?: number
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
  accessTokenExpiryDays: {
    type: Number,
    default: 1
  }
})

export default mongoose.model('Client', ClientSchema)
