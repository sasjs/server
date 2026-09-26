import path from 'path'
import { getFilesFolder } from '../../utils/file'
import { isSafePathSegment } from '../../utils/resolveWithinDrive'
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

/**
 * Thrown shape understood by the drive deploy route: `code` becomes the HTTP
 * status and `message` the body.
 */
const refuse = (code: number, message: string) => ({ code, message })

// REFACTOR: export FileTreeCpntroller
export const createFileTree = async (
  members: (FolderMember | ServiceMember | FileMember)[],
  parentFolders: string[] = []
) => {
  const destinationPath = path.join(
    getFilesFolder(),
    path.join(...parentFolders)
  )

  await asyncForEach(
    members,
    async (member: FolderMember | ServiceMember | FileMember) => {
      let name = member.name

      if (member.type === MemberType.service) name += '.sas'

      // Every member name becomes a path SEGMENT under the deployment root.
      // A name carrying '/', '\' or '..' is a traversal attempt: joined onto
      // the destination it would write outside the drive (arbitrary file
      // write as the service account - the container runs as root). Fail the
      // whole deployment rather than partially writing a hostile tree.
      if (!isSafePathSegment(name)) {
        throw refuse(
          400,
          `Invalid member name: '${name}'. Member names must be single path segments (no '/', '\\', '..').`
        )
      }

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
