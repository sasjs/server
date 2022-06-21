import { Body } from 'tsoa'
import Folder, { FolderPayload, MemberType } from '../model/Folder'

export class FolderController {
  public async createFolder(@Body() body: FolderPayload) {
    return createFolder(body)
  }

  public async addRootFolder() {
    await addRootFolder()
  }
}

interface FolderDetailsResponse {
  name: string
  parentFolderUri: string
  children: []
}

const createFolder = async ({
  name,
  parentFolderUri,
  type
}: FolderPayload): Promise<FolderDetailsResponse> => {
  parentFolderUri = parentFolderUri.replace(/\/folders\/folders\//i, '')
  const parentFolder = await Folder.findById(parentFolderUri).catch(
    (_: any) => {
      throw new Error(
        `No folder with an URI '${parentFolderUri}' has been found.`
      )
    }
  )

  const folder = new Folder({
    name,
    parentFolderUri,
    type
  })

  const savedFolder = await folder.save().catch((err: any) => {
    // TODO: log error
    throw new Error(`Error while saving folder.`)
  })

  await parentFolder?.addMember(savedFolder._id)

  return {
    name: savedFolder.name,
    parentFolderUri: savedFolder.parentFolderUri,
    children: []
  }
}

const addRootFolder = async () => {
  let folder = await Folder.findOne({ name: '/' })

  if (folder) return

  folder = new Folder({
    name: '/',
    parentFolderUri: '',
    type: MemberType.Folder
  })
  folder.parentFolderUri = folder._id

  return await folder.save()
}

const getItem = async({ path })
