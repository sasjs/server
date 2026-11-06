import { FileTree, MemberType } from '@sasjs/utils'

/**
 * A sample tree, for the deploy routes' documented payload.
 *
 * The tree's own writing is @sasjs/api's (`drive.deploy`), which validates the
 * shape, contains the appLoc, applies the cap and writes through the host's
 * store - so this file holds only the example the document shows.
 */
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
