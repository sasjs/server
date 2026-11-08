import { Schema, model, Model, HydratedDocument, Types } from 'mongoose'
import bcrypt from 'bcryptjs'
import { AuthProviderType } from '../utils'

export interface UserPayload {
  /**
   * Display name for user
   *
   * At least six characters after leading and trailing blanks are trimmed:
   * `utils/validation.ts` trims before it applies the bound, because the value is
   * trimmed again before it is stored - a name of nothing but blanks would
   * otherwise pass validation and fail at the store with a `500`.
   *
   * @minLength 6
   * @example "John Snow"
   */
  displayName: string
  /**
   * Username for user
   *
   * Three to sixteen letters and digits. Case is not part of the rule: the name
   * is folded to lower case before it is validated and stored, so `JohnSnow01` is
   * accepted and kept as `johnsnow01` - the example below is that input, not a
   * value the pattern would refuse.
   *
   * A name outside the rule is refused with a `400` before the account is looked
   * at (`utils/validation.ts`), so a client can check the field itself.
   *
   * @minLength 3
   * @maxLength 16
   * @pattern ^[A-Za-z0-9]+$
   * @example "johnSnow01"
   */
  username: string
  /**
   * Password for user
   *
   * Six characters at least, and 1024 at most - the schema in
   * `utils/validation.ts`. The minimum matters to a client: a shorter password is
   * a `400` before the account is looked at, not an authentication failure.
   *
   * @minLength 6
   * @maxLength 1024
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
      // `pull`, not `splice`: a splice can shift positions, so mongoose writes
      // it as `$set` of the WHOLE array, and a save of a modified array carries
      // a version filter - see the comment on Group.removeUser. `pull` registers
      // an atomic `$pull`, which carries no version filter and so cannot lose a
      // race.
      //
      // The cast is only for the type: the interface declares the field as an
      // array, while mongoose's runtime value carries the array helpers.
      const groups = this.groups as unknown as Types.Array<Types.ObjectId>
      groups.pull(groupObjectId)
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
