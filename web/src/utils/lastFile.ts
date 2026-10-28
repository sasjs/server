/**
 * What a user had open last, per user, in localStorage.
 *
 * Studio opens on the file the user was last in rather than on a blank buffer,
 * so a reload or a return the next day lands where they left off. The key is
 * per username: two accounts sharing a browser must not inherit each other's
 * file, and a stale path is dropped by the caller when the drive no longer has
 * it.
 *
 * This is state, not a setting, so it does not live in the settings store - and
 * every call tolerates a localStorage that is missing or throws (private mode,
 * storage disabled), because forgetting the last file is not worth an error.
 */

const KEY_PREFIX = 'studio-last-file:'

export const lastFileKey = (username: string): string =>
  `${KEY_PREFIX}${String(username ?? '')
    .trim()
    .toLowerCase()}`

/** The path to open for this user, or '' when nothing is remembered. */
export const recallLastFile = (username: string): string => {
  try {
    return (localStorage.getItem(lastFileKey(username)) ?? '').trim()
  } catch {
    return ''
  }
}

/** Remembers a path for this user. A blank path forgets instead. */
export const rememberLastFile = (username: string, filePath: string): void => {
  const path = String(filePath ?? '').trim()

  try {
    if (!path) {
      localStorage.removeItem(lastFileKey(username))
      return
    }

    localStorage.setItem(lastFileKey(username), path)
  } catch {
    // Storage unavailable: Studio still works, it just opens a blank-ish
    // default next time instead of the last file.
  }
}

/** Forgets the remembered path (the file was deleted, or refused). */
export const forgetLastFile = (username: string): void =>
  rememberLastFile(username, '')
