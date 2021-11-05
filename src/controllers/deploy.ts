import { MemberType, FolderMember, ServiceMember, FileTree } from '../types'
import { getTmpFilesFolderPath } from '../utils/file'
import { createFolder, createFile, asyncForEach } from '@sasjs/utils'
import path from 'path'

// REFACTOR: export FileTreeCpntroller
export const createFileTree = async (
  members: (FolderMember | ServiceMember)[],
  parentFolders: string[] = []
) => {
  const destinationPath = path.join(
    getTmpFilesFolderPath(),
    path.join(...parentFolders)
  )

  await asyncForEach(members, async (member: FolderMember | ServiceMember) => {
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
      await createFile(path.join(destinationPath, name), member.code).catch(
        (err) => Promise.reject({ error: err, failedToCreate: name })
      )
    }
  })

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
