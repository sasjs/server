import mongoose, { Schema } from 'mongoose'

export interface ConfigurationType {
  /**
   * SecretOrPrivateKey to sign Access Token
   * @example "someRandomCryptoString"
   */
  ACCESS_TOKEN_SECRET: string
  /**
   * SecretOrPrivateKey to sign Refresh Token
   * @example "someRandomCryptoString"
   */
  REFRESH_TOKEN_SECRET: string
  /**
   * SecretOrPrivateKey to sign Auth Code
   * @example "someRandomCryptoString"
   */
  AUTH_CODE_SECRET: string
  /**
   * Secret used to sign the session cookie
   * @example "someRandomCryptoString"
   */
  SESSION_SECRET: string
}

const ConfigurationSchema = new Schema<ConfigurationType>({
  ACCESS_TOKEN_SECRET: {
    type: String,
    required: true
  },
  REFRESH_TOKEN_SECRET: {
    type: String,
    required: true
  },
  AUTH_CODE_SECRET: {
    type: String,
    required: true
  },
  SESSION_SECRET: {
    type: String,
    required: true
  }
})

export default mongoose.model('Configuration', ConfigurationSchema)
