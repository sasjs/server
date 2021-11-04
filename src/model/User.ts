import { Schema, model } from 'mongoose'

export interface UserPayload {
  /**
   * Display name for user
   * @example "John Snow"
   */
  displayName: string
  /**
   * Username for user
   * @example "johnSnow01"
   */
  username: string
  /**
   * Password for user
   */
  password: string
  /**
   * Account should be admin or not, defaults to false
   * @example "false"
   */
  isAdmin?: boolean
  /**
   * Account should be active or not, defaults to true
   * @example "true"
   */
  isActive?: boolean
}

interface UserSchema extends UserPayload {
  isAdmin: boolean
  isActive: boolean
  tokens: [{ [key: string]: string }]
}

export default model(
  'User',
  new Schema<UserSchema>({
    displayName: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    tokens: [
      {
        clientId: {
          type: String,
          required: true
        },
        accessToken: {
          type: String,
          required: true
        },
        refreshToken: {
          type: String,
          required: true
        }
      }
    ]
  })
)
