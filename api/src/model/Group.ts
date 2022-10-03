import mongoose, { Schema, model, Document, Model } from 'mongoose'
import { GroupDetailsResponse } from '../controllers'
import User, { IUser } from './User'
import { AuthProviderType } from '../utils'
const AutoIncrement = require('mongoose-sequence')(mongoose)

export const PUBLIC_GROUP_NAME = 'Public'

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
  groupId: number
  isActive: boolean
  users: Schema.Types.ObjectId[]
  authProvider?: AuthProviderType
}

interface IGroup extends IGroupDocument {
  addUser(user: IUser): Promise<GroupDetailsResponse>
  removeUser(user: IUser): Promise<GroupDetailsResponse>
  hasUser(user: IUser): boolean
}
interface IGroupModel extends Model<IGroup> {}

const groupSchema = new Schema<IGroupDocument>({
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
})

groupSchema.plugin(AutoIncrement, { inc_field: 'groupId' })

// Hooks
groupSchema.post('save', function (group: IGroup, next: Function) {
  group.populate('users', 'id username displayName -_id').then(function () {
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
