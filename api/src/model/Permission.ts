import { Schema, model, Document, Model } from 'mongoose'
import { PermissionDetailsResponse } from '../controllers'
import { getSequenceNextValue } from '../utils'

interface GetPermissionBy {
  user?: Schema.Types.ObjectId
  group?: Schema.Types.ObjectId
}

interface IPermissionDocument extends Document {
  path: string
  type: string
  setting: string
  permissionId: number
  user: Schema.Types.ObjectId
  group: Schema.Types.ObjectId
}

interface IPermission extends IPermissionDocument {}

interface IPermissionModel extends Model<IPermission> {
  get(getBy: GetPermissionBy): Promise<PermissionDetailsResponse[]>
}

const permissionSchema = new Schema<IPermissionDocument>({
  permissionId: {
    type: Number,
    unique: true
  },
  path: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  setting: {
    type: String,
    required: true
  },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  group: { type: Schema.Types.ObjectId, ref: 'Group' }
})

// Hooks
permissionSchema.pre('save', async function () {
  if (this.isNew) {
    this.permissionId = await getSequenceNextValue('permissionId')
  }
})

// Static Methods
permissionSchema.static('get', async function (getBy: GetPermissionBy): Promise<
  PermissionDetailsResponse[]
> {
  return (await this.find(getBy)
    .select({
      _id: 0,
      permissionId: 1,
      path: 1,
      type: 1,
      setting: 1
    })
    .populate({ path: 'user', select: 'id username displayName isAdmin -_id' })
    .populate({
      path: 'group',
      select: 'groupId name description -_id',
      populate: {
        path: 'users',
        select: 'id username displayName isAdmin -_id',
        options: { limit: 15 }
      }
    })) as unknown as PermissionDetailsResponse[]
})

export const Permission: IPermissionModel = model<
  IPermission,
  IPermissionModel
>('Permission', permissionSchema)

export default Permission
