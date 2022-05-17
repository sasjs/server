import Folder, { MemberType } from '../model/Folder'

export class FolderController {
  public async addRootFolder() {
    await addRootFolder()
  }
}

const addRootFolder = async () => {
  let folder = await Folder.findOne({ name: '/' })

  if (folder) return

  folder = new Folder({
    name: '/',
    parentFolderUri: '/',
    type: MemberType.Folder
  })

  return await folder.save()
}
