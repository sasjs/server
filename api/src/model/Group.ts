import { Schema, model, Model, HydratedDocument, Types } from 'mongoose'
import { GroupDetailsResponse } from '../controllers'
import User, { IUserDocument } from './User'
import { AuthProviderType } from '../utils'

export const PUBLIC_GROUP_NAME = 'public'

export interface GroupPayload {
  /**
   * Name of the group
   * @example "DCGroup"
   */
  name: string
  /**
   * Description of the group
   * @example "This group represents Data Controller Users"
   */
  description: string
  /**
   * Group should be active or not, defaults to true
   * @example "true"
   */
  isActive?: boolean
}

interface IGroupFields extends GroupPayload {
  isActive: boolean
  users: Types.ObjectId[]
  authProvider?: AuthProviderType
}

interface IGroupVirtuals {
  readonly uid: string
}

interface IGroupMethods {
  addUser(user: IUserDocument): Promise<IGroupDocument>
  removeUser(user: IUserDocument): Promise<IGroupDocument>
  hasUser(user: IUserDocument): boolean
}

export type IGroupDocument = HydratedDocument<
  IGroupFields,
  IGroupMethods & IGroupVirtuals
>

export interface IGroup extends IGroupFields, IGroupVirtuals, IGroupMethods {}

interface IGroupModel extends Model<
  IGroupFields,
  {},
  IGroupMethods,
  IGroupVirtuals
> {}

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

const groupSchema = new Schema<
  IGroupFields,
  IGroupModel,
  IGroupMethods,
  {},
  IGroupVirtuals
>(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    description: {
      type: String,
      default: 'Group description.'
    },
    authProvider: {
      type: String,
      enum: AuthProviderType
    },
    isActive: {
      type: Boolean,
      default: true
    },
    users: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  opts
)

groupSchema.virtual('uid').get(function () {
  return this._id.toString()
})

groupSchema.post('save', function (group: any, next: Function) {
  group.populate('users', 'uid username displayName').then(function () {
    next()
  })
})

// pre remove hook to remove all references of group from users
groupSchema.pre(
  'deleteOne',
  { document: true, query: false },
  async function () {
    const doc = this as unknown as IGroupDocument
    const userIds = doc.users
    await Promise.all(
      userIds.map(async (userId) => {
        const user = await User.findById(userId)
        await user?.removeGroup(doc._id)
      })
    )
  }
)

// Instance Methods
groupSchema.method('addUser', async function (user: IUserDocument) {
  const userObjectId = user._id
  const userIdIndex = this.users.indexOf(userObjectId)
  if (userIdIndex === -1) {
    this.users.push(userObjectId)
    // Awaited: the caller must not resolve before the membership is durable,
    // and a save still in flight is what an overlapping update trips over.
    await user.addGroup(this._id)
  }
  this.markModified('users')
  return this.save()
})
groupSchema.method('removeUser', async function (user: IUserDocument) {
  const userObjectId = user._id
  const userIdIndex = this.users.indexOf(userObjectId)
  if (userIdIndex > -1) {
    // `pull`, not `splice`: a splice can shift array positions, so mongoose
    // writes it as `$set` of the WHOLE `users` array, and a save of a modified
    // array carries a version filter (`{_id, __v}` in the query). Two membership
    // updates that overlap - two sign-ins for the same user, or a sign-in racing
    // a directory sync - then make the second fail with
    //
    //   VersionError: No matching document found for id ... modifiedPaths "users"
    //
    // `pull` registers an atomic `$pull`, which carries no version filter.
    //
    // The cast is only for the type: the interface declares the field as an
    // array, while mongoose's runtime value carries the array helpers.
    const users = this.users as unknown as Types.Array<Types.ObjectId>
    users.pull(userObjectId)
    await user.removeGroup(this._id)
  }
  this.markModified('users')
  return this.save()
})
groupSchema.method('hasUser', function (user: IUserDocument) {
  const userObjectId = user._id
  const userIdIndex = this.users.indexOf(userObjectId)
  return userIdIndex > -1
})

export const Group: IGroupModel = model<IGroupFields, IGroupModel>(
  'Group',
  groupSchema
)

export default Group
