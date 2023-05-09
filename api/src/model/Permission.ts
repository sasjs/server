import { Schema, model, Document, Model } from 'mongoose'
import { PermissionDetailsResponse } from '../controllers'

interface GetPermissionBy {
  user?: Schema.Types.ObjectId
  group?: Schema.Types.ObjectId
}

interface IPermissionDocument extends Document {
  path: string
  type: string
  setting: string
  user: Schema.Types.ObjectId
  group: Schema.Types.ObjectId

  // Declare virtual properties as read-only properties
  readonly uid: string
}

interface IPermission extends IPermissionDocument {}

interface IPermissionModel extends Model<IPermission> {
  get(getBy: GetPermissionBy): Promise<PermissionDetailsResponse[]>
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

const permissionSchema = new Schema<IPermissionDocument>(
  {
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
  },
  opts
)

permissionSchema.virtual('uid').get(function () {
  return this._id.toString()
})

// Static Methods
permissionSchema.static('get', async function (getBy: GetPermissionBy): Promise<
  PermissionDetailsResponse[]
> {
  return (await this.find(getBy)
    .select('uid path type setting')
    .populate({ path: 'user', select: 'uid username displayName isAdmin' })
    .populate({
      path: 'group',
      select: 'uid name description',
      populate: {
        path: 'users',
        select: 'uid username displayName isAdmin',
        options: { limit: 15 }
      }
    })) as unknown as PermissionDetailsResponse[]
})

export const Permission: IPermissionModel = model<
  IPermission,
  IPermissionModel
>('Permission', permissionSchema)

export default Permission
