import { string } from 'joi'
import mongoose, { Schema, model, Document, Model } from 'mongoose'
const AutoIncrement = require('mongoose-sequence')(mongoose)

export interface PermissionPayload {
  /**
   * Name of affected resource
   * @example "/SASjsApi/code/execute"
   */
  uri: string
}

interface IPermissionDocument extends PermissionPayload, Document {
  permissionId: number
  users: [{ id: Schema.Types.ObjectId; setting: string }]
  groups: [{ id: Schema.Types.ObjectId; setting: string }]
  clients: [{ id: Schema.Types.ObjectId; setting: string }]
}

interface IPermission extends IPermissionDocument {
  addPermission(
    objectId: Schema.Types.ObjectId,
    objectType: string,
    setting: string
  ): Promise<IPermission>
  updatePermission(
    objectId: Schema.Types.ObjectId,
    objectType: string,
    setting: string
  ): Promise<IPermission>
  removePermission(
    objectId: Schema.Types.ObjectId,
    objectType: string
  ): Promise<IPermission>
}

interface IPermissionModel extends Model<IPermission> {}

const permissionSchema = new Schema<IPermissionDocument>({
  uri: {
    type: String,
    required: true
  },
  users: [
    {
      id: { type: Schema.Types.ObjectId, ref: 'User' },
      setting: { type: String }
    }
  ],
  groups: [
    {
      id: { type: Schema.Types.ObjectId, ref: 'Group' },
      setting: { type: String }
    }
  ],
  clients: [
    {
      id: { type: Schema.Types.ObjectId, ref: 'Client' },
      setting: { type: String }
    }
  ]
})

permissionSchema.plugin(AutoIncrement, { inc_field: 'permissionId' })

// Instance Methods
permissionSchema.method(
  'addPermission',
  async function (
    objectId: Schema.Types.ObjectId,
    objectType: string,
    setting: string
  ) {
    switch (objectType) {
      case 'User':
        const user = this.users.find((obj) => obj.id === objectId)
        if (!user) {
          this.users.push({ id: objectId, setting })
        }
        this.markModified('users')
        break
      case 'Group':
        const group = this.groups.find((obj) => obj.id === objectId)
        if (!group) {
          this.groups.push({ id: objectId, setting })
        }
        this.markModified('groups')
        break
      case 'Client':
        const client = this.clients.find((obj) => obj.id === objectId)
        if (!client) {
          this.clients.push({ id: objectId, setting })
        }
        this.markModified('clients')
        break
    }
    return this.save()
  }
)

permissionSchema.method(
  'updatePermission',
  async function (
    objectId: Schema.Types.ObjectId,
    objectType: string,
    setting: string
  ) {
    switch (objectType) {
      case 'User':
        const user = this.users.find(
          (obj) => obj.id === objectId && obj.setting !== setting
        )
        if (user) user.setting = setting
        this.markModified('users')
        break
      case 'Group':
        const group = this.groups.find(
          (obj) => obj.id === objectId && obj.setting !== setting
        )
        if (group) group.setting = setting
        this.markModified('groups')
        break
      case 'Client':
        const client = this.clients.find(
          (obj) => obj.id === objectId && obj.setting !== setting
        )
        if (client) client.setting = setting
        this.markModified('clients')
        break
    }
    return this.save()
  }
)

permissionSchema.method(
  'removePermission',
  async function (objectId: Schema.Types.ObjectId, objectType: string) {
    switch (objectType) {
      case 'User':
        const userIndex = this.users.findIndex((obj) => obj.id === objectId)
        if (userIndex !== -1) {
          this.users.splice(userIndex, 1)
        }
        this.markModified('users')
        break
      case 'Group':
        const groupIndex = this.groups.findIndex((obj) => obj.id === objectId)
        if (groupIndex !== -1) {
          this.groups.splice(groupIndex, 1)
        }
        this.markModified('groups')
        break
      case 'Client':
        const clientIndex = this.clients.findIndex((obj) => obj.id === objectId)
        if (clientIndex !== -1) {
          this.clients.splice(clientIndex, 1)
        }
        this.markModified('clients')
        break
    }
    return this.save()
  }
)

export const Permission: IPermissionModel = model<
  IPermission,
  IPermissionModel
>('Permission', permissionSchema)

export default Permission
