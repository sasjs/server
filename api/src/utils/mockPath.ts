import path from 'path'

/**
 * Where the SAS 9 mock's files live.
 *
 * `STATIC_MOCK_LOCATION` is the folder the mock's pages, stored-process mocks and
 * static assets are read from. A relative value is resolved against the working
 * directory; an absolute one is used as written, because `path.join` would put it
 * under the working directory instead.
 *
 * The rule lives here rather than in the controller because it is a rule, not a
 * path: it decides what an absolute and a relative setting mean. An upload is not
 * one of its callers - the mock's upload route hands its parts to
 * `FileUploadController`, which writes them into the caller's session folder.
 */
export const resolveMockPath = (
  configured: string = process.env.STATIC_MOCK_LOCATION || 'mocks'
): string =>
  path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured)
