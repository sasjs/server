import path from 'path'

/**
 * Where the SAS 9 mock's files live.
 *
 * `STATIC_MOCK_LOCATION` is the folder the pages, the stored-process mocks and
 * the uploads are read from and written to. A relative value is resolved
 * against the working directory; an absolute one is used as written, because
 * `path.join` would put it under the working directory instead.
 *
 * The controller and the upload route both need this, so the rule lives here
 * rather than in each of them.
 */
export const resolveMockPath = (
  configured: string = process.env.STATIC_MOCK_LOCATION || 'mocks'
): string =>
  path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured)

/**
 * The folder multer writes uploads into: the mock's folder with the route's own
 * subfolder beneath it.
 */
export const mockUploadDestination = (): string =>
  path.join(resolveMockPath(), 'sas9', 'files-received')
