import mongoose, { Schema, model, Document, Model } from 'mongoose'
const AutoIncrement = require('mongoose-sequence')(mongoose)

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
}

interface IGroup extends IGroupDocument {
  addUser(userObjectId: Schema.Types.ObjectId): Promise<IGroup>
  removeUser(userObjectId: Schema.Types.ObjectId): Promise<IGroup>
}
interface IGroupModel extends Model<IGroup> {}

const groupSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: 'Group description.'
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

// Instance Methods
groupSchema.method(
  'addUser',
  async function (userObjectId: Schema.Types.ObjectId) {
    const userIdIndex = this.users.indexOf(userObjectId)
    if (userIdIndex === -1) {
      this.users.push(userObjectId)
    }
    this.markModified('users')
    return this.save()
  }
)
groupSchema.method(
  'removeUser',
  async function (userObjectId: Schema.Types.ObjectId) {
    const userIdIndex = this.users.indexOf(userObjectId)
    if (userIdIndex > -1) {
      this.users.splice(userIdIndex, 1)
    }
    this.markModified('users')
    return this.save()
  }
)

export const Group: IGroupModel = model<IGroup, IGroupModel>(
  'Group',
  groupSchema
)

export default Group
