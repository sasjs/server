/**
 * How the detailed Apps list is ordered, how a release is dated, and which order
 * the reader last chose.
 *
 * The listing comes from the server in the order the registry holds it, which
 * is not an order a reader can name. The question a reader actually asks of a
 * deployment - "what went out last?" - is answered by the release time, so the
 * list view sorts by it and says both the day and the minute, because two apps
 * released on the same afternoon differ only in the time.
 *
 * The ordering and the label are pure, so they can be asserted without
 * rendering a component. The remembered order is the one piece of browser state
 * here, and it sits beside them on purpose: the key, the read and the write are
 * one behaviour, and keeping them together means the round trip can be tested
 * against a stubbed localStorage instead of being a key in one file and a read
 * in another.
 */

/** Which end of the release timeline the list starts at. */
export type ReleaseOrder = 'newest' | 'oldest'

/** What sorting by release needs to know about an app. */
export interface ReleaseDated {
  title: string
  /** When the bundle was last published, or null for an older registry. */
  publishedAt?: string | null
}

/** The release time as a number, or null when the app carries no usable date. */
const releaseTime = (app: ReleaseDated): number | null => {
  if (!app.publishedAt) return null

  const when = new Date(app.publishedAt)

  return isNaN(when.getTime()) ? null : when.getTime()
}

/**
 * The apps in release order, newest first unless `oldest` was chosen.
 *
 * An app with no recorded release is not an old release, it is an undated one:
 * it goes after the dated apps whichever way they are read, because putting it
 * first would claim it is the newest thing on the server. Apps released at the
 * same moment - a batch publish - keep a stable order by name.
 */
export const byReleaseTime = <T extends ReleaseDated>(
  apps: readonly T[],
  order: ReleaseOrder = 'newest'
): T[] => {
  const direction = order === 'oldest' ? 1 : -1

  return [...apps].sort((left, right) => {
    const leftTime = releaseTime(left)
    const rightTime = releaseTime(right)

    if (leftTime === null && rightTime === null)
      return left.title.localeCompare(right.title)

    if (leftTime === null) return 1
    if (rightTime === null) return -1

    if (leftTime !== rightTime) return (leftTime - rightTime) * direction

    return left.title.localeCompare(right.title)
  })
}

/**
 * When an app was released, as a reader reads it - the day and the time - or an
 * empty string when the registry holds no usable date.
 *
 * The time is not decoration: "published 21 Nov 2026" is true of every app
 * published that day, and a reader comparing two of them is asking which came
 * second. The locale decides the order and the separators; the parts do not.
 */
export const publishedLabel = (publishedAt?: string | null): string => {
  if (!publishedAt) return ''

  const when = new Date(publishedAt)

  if (isNaN(when.getTime())) return ''

  return `published ${when.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`
}

const KEY_PREFIX = 'sasjs-apps-order:'

/**
 * The order this user chose, per user, in localStorage.
 *
 * Per username, because two accounts sharing a browser must not inherit each
 * other's reading order - the same rule Studio's last file follows. State, not a
 * setting, so it does not live in the settings store, and every call tolerates a
 * localStorage that is missing or throws (private mode, storage disabled).
 */
export const appsOrderKey = (username: string): string =>
  `${KEY_PREFIX}${String(username ?? '')
    .trim()
    .toLowerCase()}`

/** The order to open the list in, newest first when nothing is remembered. */
export const recallOrder = (username: string): ReleaseOrder => {
  try {
    return localStorage.getItem(appsOrderKey(username)) === 'oldest'
      ? 'oldest'
      : 'newest'
  } catch {
    return 'newest'
  }
}

/** Remembers an order for this user. */
export const rememberOrder = (username: string, order: ReleaseOrder): void => {
  try {
    localStorage.setItem(appsOrderKey(username), order)
  } catch {
    // Storage unavailable: the choice survives the page, not the browser.
  }
}
