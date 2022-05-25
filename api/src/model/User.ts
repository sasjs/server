import mongoose, { Schema, model, Document, Model } from 'mongoose'
const AutoIncrement = require('mongoose-sequence')(mongoose)
import bcrypt from 'bcryptjs'

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
  /**
   * User-specific auto-exec code
   * @example ""
   */
  autoExec?: string
}

interface IUserDocument extends UserPayload, Document {
  id: number
  isAdmin: boolean
  isActive: boolean
  autoExec: string
  groups: Schema.Types.ObjectId[]
  tokens: [{ [key: string]: string }]
}

interface IUser extends IUserDocument {
  comparePassword(password: string): boolean
}
interface IUserModel extends Model<IUser> {
  hashPassword(password: string): string
}

const userSchema = new Schema<IUserDocument>({
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
  autoExec: {
    type: String
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
userSchema.plugin(AutoIncrement, { inc_field: 'id' })

// Static Methods
userSchema.static('hashPassword', (password: string): string => {
  const salt = bcrypt.genSaltSync(10)
  return bcrypt.hashSync(password, salt)
})

// Instance Methods
userSchema.method('comparePassword', function (password: string): boolean {
  if (bcrypt.compareSync(password, this.password)) return true
  return false
})

export const User: IUserModel = model<IUser, IUserModel>('User', userSchema)

export default User
