import mongoose, { Schema, model, Document, Model } from 'mongoose'
const AutoIncrement = require('mongoose-sequence')(mongoose)
import bcrypt from 'bcryptjs'
import { AuthProviderType } from '../utils'

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
  _id: Schema.Types.ObjectId
  id: number
  isAdmin: boolean
  isActive: boolean
  needsToUpdatePassword: boolean
  autoExec: string
  groups: Schema.Types.ObjectId[]
  tokens: [{ [key: string]: string }]
  authProvider?: AuthProviderType
}

export interface IUser extends IUserDocument {
  comparePassword(password: string): boolean
  addGroup(groupObjectId: Schema.Types.ObjectId): Promise<IUser>
  removeGroup(groupObjectId: Schema.Types.ObjectId): Promise<IUser>
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
  authProvider: {
    type: String,
    enum: AuthProviderType
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  needsToUpdatePassword: {
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
userSchema.method(
  'addGroup',
  async function (groupObjectId: Schema.Types.ObjectId) {
    const groupIdIndex = this.groups.indexOf(groupObjectId)
    if (groupIdIndex === -1) {
      this.groups.push(groupObjectId)
    }
    this.markModified('groups')
    return this.save()
  }
)
userSchema.method(
  'removeGroup',
  async function (groupObjectId: Schema.Types.ObjectId) {
    const groupIdIndex = this.groups.indexOf(groupObjectId)
    if (groupIdIndex > -1) {
      this.groups.splice(groupIdIndex, 1)
    }
    this.markModified('groups')
    return this.save()
  }
)

export const User: IUserModel = model<IUser, IUserModel>('User', userSchema)

export default User
