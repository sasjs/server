import { Schema, model, Model, HydratedDocument, Types } from 'mongoose'
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

interface IUserFields extends UserPayload {
  isAdmin: boolean
  isActive: boolean
  needsToUpdatePassword: boolean
  autoExec: string
  groups: Types.ObjectId[]
  tokens: { clientId: string; accessToken: string; refreshToken: string }[]
  authProvider?: AuthProviderType
  /**
   * The provider's own durable identifier for this user - the OIDC `sub`
   * claim. Usernames are a local, normalised projection of whatever the
   * provider asserted and can in principle change; `sub` is what actually
   * identifies the account, so lookups go through this first.
   */
  authProviderId?: string
}

interface IUserVirtuals {
  readonly uid: string
}

interface IUserMethods {
  comparePassword(password: string): boolean
  addGroup(groupObjectId: Types.ObjectId): Promise<IUserDocument>
  removeGroup(groupObjectId: Types.ObjectId): Promise<IUserDocument>
}

export type IUserDocument = HydratedDocument<
  IUserFields,
  IUserMethods & IUserVirtuals
>

export interface IUser extends IUserFields, IUserVirtuals, IUserMethods {}

interface IUserModel extends Model<
  IUserFields,
  {},
  IUserMethods,
  IUserVirtuals
> {
  hashPassword(password: string): string
}

const opts = {
  toJSON: {
    virtuals: true,
    transform: function (doc: any, ret: any, options: any) {
      delete ret._id
      delete ret.id
      return ret
    }
  }
}

const userSchema = new Schema<
  IUserFields,
  IUserModel,
  IUserMethods,
  {},
  IUserVirtuals
>(
  {
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
    authProviderId: {
      type: String
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
  },
  opts
)

userSchema.virtual('uid').get(function () {
  return this._id.toString()
})

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
userSchema.method('addGroup', async function (groupObjectId: Types.ObjectId) {
  const groupIdIndex = this.groups.indexOf(groupObjectId)
  if (groupIdIndex === -1) {
    this.groups.push(groupObjectId)
  }
  this.markModified('groups')
  return this.save()
})
userSchema.method(
  'removeGroup',
  async function (groupObjectId: Types.ObjectId) {
    const groupIdIndex = this.groups.indexOf(groupObjectId)
    if (groupIdIndex > -1) {
      this.groups.splice(groupIdIndex, 1)
    }
    this.markModified('groups')
    return this.save()
  }
)

export const User: IUserModel = model<IUserFields, IUserModel>(
  'User',
  userSchema
)

export default User
