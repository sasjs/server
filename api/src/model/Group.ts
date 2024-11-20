import { Schema, model, Document, Model } from 'mongoose'
import { GroupDetailsResponse } from '../controllers'
import User, { IUser } from './User'
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

interface IGroupDocument extends GroupPayload, Document {
  isActive: boolean
  users: Schema.Types.ObjectId[]
  authProvider?: AuthProviderType

  // Declare virtual properties as read-only properties
  readonly uid: string
}

interface IGroup extends IGroupDocument {
  addUser(user: IUser): Promise<GroupDetailsResponse>
  removeUser(user: IUser): Promise<GroupDetailsResponse>
  hasUser(user: IUser): boolean
}
interface IGroupModel extends Model<IGroup> {}

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
const groupSchema = new Schema<IGroupDocument>(
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

groupSchema.post('save', function (group: IGroup, next: Function) {
  group.populate('users', 'uid username displayName').then(function () {
    next()
  })
})

// pre remove hook to remove all references of group from users
groupSchema.pre('remove', async function () {
  const userIds = this.users
  await Promise.all(
    userIds.map(async (userId) => {
      const user = await User.findById(userId)
      user?.removeGroup(this._id)
    })
  )
})

// Instance Methods
groupSchema.method('addUser', async function (user: IUser) {
  const userObjectId = user._id
  const userIdIndex = this.users.indexOf(userObjectId)
  if (userIdIndex === -1) {
    this.users.push(userObjectId)
    user.addGroup(this._id)
  }
  this.markModified('users')
  return this.save()
})
groupSchema.method('removeUser', async function (user: IUser) {
  const userObjectId = user._id
  const userIdIndex = this.users.indexOf(userObjectId)
  if (userIdIndex > -1) {
    this.users.splice(userIdIndex, 1)
    user.removeGroup(this._id)
  }
  this.markModified('users')
  return this.save()
})
groupSchema.method('hasUser', function (user: IUser) {
  const userObjectId = user._id
  const userIdIndex = this.users.indexOf(userObjectId)
  return userIdIndex > -1
})

export const Group: IGroupModel = model<IGroup, IGroupModel>(
  'Group',
  groupSchema
)

export default Group
