import { Document, Schema, Model, model } from 'mongoose'
import {} from '@sasjs/utils'

export interface FolderPayload {
  parentFolderUri: string
  name: string
  type: MemberType
}

export enum MemberType {
  Folder = 'Folder',
  File = 'File'
}

const isMemberType = (value: string) => value in MemberType

export const getMemberType = (value: string) => {
  value
}

interface IFolderDocument extends FolderPayload, Document {
  members: Schema.Types.ObjectId[]
  type: MemberType
}

interface IFolder extends IFolderDocument {
  addMember(memberId: Schema.Types.ObjectId): Promise<IFolder>
}

interface IFolderModel extends Model<IFolder> {}

const folderSchema = new Schema({
  name: { type: String, required: true },
  parentFolderUri: { type: String, required: true },
  members: [{ type: Schema.Types.ObjectId, refPath: 'member' }],
  type: { type: String, required: true }
})

folderSchema.post('save', (folder: IFolder, next: Function) => {
  folder.populate('members', '').then(() => next())

  next()
})

// folderSchema.get('item', (folder: IFolder, next: Function) => {

//   next()
// })

folderSchema.method(
  'addMember',
  async function (memberId: Schema.Types.ObjectId) {
    const folderIdIndex = this.members.indexOf(memberId)

    if (folderIdIndex === -1) this.members.push(memberId)

    this.markModified('folders')

    return this.save()
  }
)

folderSchema.method('getItem', async function (path: string) {
  console.log(`🤖[getItem]🤖`)
  console.log(`🤖[path]🤖`, path)
  // const folderIdIndex = this.members.indexOf(memberId)

  // if (folderIdIndex === -1) this.members.push(memberId)

  // this.markModified('folders')

  // return this.save()
})

export const Folder: IFolderModel = model<IFolder, IFolderModel>(
  'Folder',
  folderSchema
)

export default Folder
