import { Schema, model, Model, HydratedDocument, Types } from 'mongoose'
import { PermissionDetailsResponse } from '../controllers'

interface GetPermissionBy {
  user?: Types.ObjectId
  group?: Types.ObjectId
}

interface IPermissionFields {
  path: string
  type: string
  setting: string
  user?: Types.ObjectId
  group?: Types.ObjectId
}

interface IPermissionVirtuals {
  readonly uid: string
}

export type IPermissionDocument = HydratedDocument<
  IPermissionFields,
  IPermissionVirtuals
>

export interface IPermission extends IPermissionFields, IPermissionVirtuals {}

interface IPermissionModel extends Model<
  IPermissionFields,
  {},
  {},
  IPermissionVirtuals
> {
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

const permissionSchema = new Schema<
  IPermissionFields,
  IPermissionModel,
  {},
  {},
  IPermissionVirtuals
>(
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
  // No populate: a rule carries its principal's identifier, which every store
  // can answer, and serialising the whole account also sent a group's membership
  // back with every rule that granted it.
  return (await this.find(getBy).select(
    'uid path type setting user group'
  )) as unknown as PermissionDetailsResponse[]
})

export const Permission: IPermissionModel = model<
  IPermissionFields,
  IPermissionModel
>('Permission', permissionSchema)

export default Permission
