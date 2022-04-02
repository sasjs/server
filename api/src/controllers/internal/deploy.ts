import path from 'path'
import { getTmpFilesFolderPath } from '../../utils/file'
import {
  createFolder,
  createFile,
  asyncForEach,
  FolderMember,
  ServiceMember,
  FileMember,
  MemberType,
  FileTree
} from '@sasjs/utils'

// REFACTOR: export FileTreeCpntroller
export const createFileTree = async (
  members: (FolderMember | ServiceMember | FileMember)[],
  parentFolders: string[] = []
) => {
  const destinationPath = path.join(
    getTmpFilesFolderPath(),
    path.join(...parentFolders)
  )

  await asyncForEach(
    members,
    async (member: FolderMember | ServiceMember | FileMember) => {
      let name = member.name

      if (member.type === MemberType.service) name += '.sas'

      if (member.type === MemberType.folder) {
        await createFolder(path.join(destinationPath, name)).catch((err) =>
          Promise.reject({ error: err, failedToCreate: name })
        )

        await createFileTree(member.members, [...parentFolders, name]).catch(
          (err) => Promise.reject({ error: err, failedToCreate: name })
        )
      } else {
        const encoding = member.type === MemberType.file ? 'base64' : undefined

        await createFile(
          path.join(destinationPath, name),
          member.code,
          encoding
        ).catch((err) => Promise.reject({ error: err, failedToCreate: name }))
      }
    }
  )

  return Promise.resolve()
}

export const getTreeExample = (): FileTree => ({
  members: [
    {
      name: 'jobs',
      type: MemberType.folder,
      members: [
        {
          name: 'extract',
          type: MemberType.folder,
          members: [
            {
              name: 'makedata1',
              type: MemberType.service,
              code: '%put Hello World!;'
            }
          ]
        }
      ]
    }
  ]
})
