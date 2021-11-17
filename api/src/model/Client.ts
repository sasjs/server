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
}

const ClientSchema = new Schema<ClientPayload>({
  clientId: {
    type: String,
    required: true
  },
  clientSecret: {
    type: String,
    required: true
  }
})

export default mongoose.model('Client', ClientSchema)
