/**
 * Where a freshly opened Studio buffer lives.
 *
 * A new buffer used to have no path at all. Nothing to run against (`_program`
 * stayed empty, so a program could not reference its own folder), nothing to
 * save to without a modal, and nothing in the explorer - the file had no home.
 *
 * Every user now gets one stable home with a single default program in it:
 * `/home/<username>/program.sas`. One path per user means nothing accumulates
 * on the drive, `_program` is predictable, and a reload lands on the same file.
 *
 * The path is only ever CREATED, never written over: the drive refuses a second
 * POST for an existing file with 409 and the caller treats that as success, so
 * reopening Studio cannot destroy a program someone is working in.
 *
 * The helpers are pure, so the names they produce can be tested without a
 * browser.
 */

export const USER_HOME_ROOT = '/home'

/** The default program a fresh buffer is created as. */
export const DEFAULT_PROGRAM_NAME = 'program.sas'

/**
 * One path segment that cannot escape the folder it is placed in: anything
 * outside a conservative set becomes a dash, and an empty result falls back to
 * a fixed label rather than producing `//`.
 */
export const safeSegment = (value: string, fallback = 'anonymous'): string => {
  const cleaned = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')

  return cleaned || fallback
}

/** The user's home folder on the drive: `/home/<username>`. */
export const homeFolderFor = (username: string): string =>
  `${USER_HOME_ROOT}/${safeSegment(username)}`

/** The default program in that home: `/home/<username>/program.sas`. */
export const homeFilePathFor = (username: string): string =>
  `${homeFolderFor(username)}/${DEFAULT_PROGRAM_NAME}`

/** Whether a path is inside a user home, for a caller that cares. */
export const isUserHomePath = (filePath: string): boolean =>
  filePath === USER_HOME_ROOT || filePath.startsWith(`${USER_HOME_ROOT}/`)
