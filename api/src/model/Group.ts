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
        user?.removeGroup(doc._id)
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
    user.addGroup(this._id)
  }
  this.markModified('users')
  return this.save()
})
groupSchema.method('removeUser', async function (user: IUserDocument) {
  const userObjectId = user._id
  const userIdIndex = this.users.indexOf(userObjectId)
  if (userIdIndex > -1) {
    this.users.splice(userIdIndex, 1)
    user.removeGroup(this._id)
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
