/**
 * The drive path of a user's home folder.
 *
 * Kept in step with `web/src/utils/userHome.ts`: the Studio client opens
 * `/home/<username>/program.sas` and the server provisions `/home/<username>`,
 * so the two have to agree exactly on how a username becomes a path segment.
 * Lowercased, anything outside `a-z 0-9 . _ -` folded to `-`, and a name that
 * leaves nothing usable falls back rather than producing `//`.
 */

export const USER_HOME_ROOT = '/home'

export const userHomeSegment = (username: string): string => {
  const cleaned = String(username ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')

  return cleaned || ''
}

/**
 * `/home/<username>`, or '' when the name cannot be a safe path segment.
 *
 * Returning '' rather than a fallback folder is deliberate: a user whose name
 * folds away (say, all punctuation) must not silently share a home with
 * whoever else folds to the same fallback.
 */
export const userHomeFolderFor = (username: string): string => {
  const segment = userHomeSegment(username)

  return segment ? `${USER_HOME_ROOT}/${segment}` : ''
}
