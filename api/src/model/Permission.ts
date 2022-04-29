import mongoose, { Schema, model, Document, Model } from 'mongoose'
const AutoIncrement = require('mongoose-sequence')(mongoose)

interface IPermissionDocument extends Document {
  uri: string
  setting: string
  permissionId: number
  user: Schema.Types.ObjectId
  group: Schema.Types.ObjectId
  client: Schema.Types.ObjectId
}

interface IPermission extends IPermissionDocument {}

interface IPermissionModel extends Model<IPermission> {}

const permissionSchema = new Schema<IPermissionDocument>({
  uri: {
    type: String,
    required: true
  },
  setting: {
    type: String,
    required: true
  },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  group: { type: Schema.Types.ObjectId, ref: 'Group' },
  client: { type: Schema.Types.ObjectId, ref: 'Client' }
})

permissionSchema.plugin(AutoIncrement, { inc_field: 'permissionId' })

export const Permission: IPermissionModel = model<
  IPermission,
  IPermissionModel
>('Permission', permissionSchema)

export default Permission
