import mongoose, { Schema, model } from 'mongoose'
const AutoIncrement = require('mongoose-sequence')(mongoose)

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

interface User extends UserPayload {
  id: number
  isAdmin: boolean
  isActive: boolean
  groups: Schema.Types.ObjectId[]
  tokens: [{ [key: string]: string }]
}

const UserSchema = new Schema<User>({
  displayName: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
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
  groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
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
UserSchema.plugin(AutoIncrement, { inc_field: 'id' })

export default model('User', UserSchema)
