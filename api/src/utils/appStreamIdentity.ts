import { createHash } from 'crypto'

/**
 * How many hex characters an app id carries.
 *
 * Eight is 32 bits, which makes an accidental collision between two folders a
 * one-in-four-billion event rather than a design question. Short ids are tempting
 * for the URL, but the id is the identity: a collision is not a cosmetic problem,
 * it is two apps claiming one entry, and the cheapest insurance is four more
 * characters. `ID_LENGTHS` still grows if a collision does happen, so the length
 * is a default rather than a limit.
 */
export const APP_ID_LENGTH = 8

/** Escape hatches for a taken id, in the order they are tried. */
export const ID_LENGTHS = [APP_ID_LENGTH, 12, 16, 24, 64]

/**
 * The canonical spelling of an app location, and the only thing an id is made
 * from.
 *
 * Two spellings of one folder must never produce two ids, so this normalises
 * before hashing rather than trusting the caller: surrounding space, a missing
 * leading slash, repeated slashes and a trailing slash are all the same folder and
 * are all `/Public/apps/mario`. Case is deliberately NOT folded: the drive is a
 * real filesystem, case-sensitive where it matters, and two folders that differ
 * only in case are two folders. Folding would merge them, which is worse than
 * keeping them apart.
 */
export const normaliseAppLoc = (appLoc: string): string => {
  const collapsed = String(appLoc ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/\/{2,}/g, '/')

  const withLeadingSlash = collapsed.startsWith('/')
    ? collapsed
    : `/${collapsed}`

  // '.' and '..' are resolved rather than passed through: the deploy writes with
  // path.resolve, which treats '/Public/apps/x/../mario' and '/Public/apps/mario'
  // as one folder, so hashing the raw spelling would give one folder two ids -
  // the exact failure this function exists to prevent.
  const resolved: string[] = []

  for (const segment of withLeadingSlash.split('/')) {
    if (!segment || segment === '.') continue

    if (segment === '..') {
      resolved.pop()
      continue
    }

    resolved.push(segment)
  }

  return `/${resolved.join('/')}`
}

/**
 * The id an app would have, given the ids already in use.
 *
 * A pure function of the normalised location until something else holds the same
 * prefix, which is the same thing as "stable for the life of the folder": the
 * extension only fires when two different locations hash to the same leading
 * characters, and then only for the later one.
 */
export const appIdFor = (appLoc: string, taken: string[] = []): string => {
  const normalised = normaliseAppLoc(appLoc)
  const digest = createHash('sha256').update(normalised).digest('hex')

  for (const length of ID_LENGTHS) {
    const candidate = digest.slice(0, length)

    if (!taken.includes(candidate)) return candidate
  }

  // every length tried and taken: this is not a collision any more, it is a
  // corrupt registry, and returning the full digest is the answer that cannot be
  // wrong about which app it names
  return digest
}

/**
 * Whether a string is a well-formed id.
 *
 * Membership of the lengths `appIdFor` can mint, not a range: a range admits any
 * length between the shortest and the longest, so a hand-edited nine-character id
 * would be accepted as an identity no publish could have produced, and then
 * trusted.
 */
export const isAppId = (value: unknown): value is string =>
  typeof value === 'string' &&
  ID_LENGTHS.includes(value.length) &&
  /^[0-9a-f]+$/.test(value)
