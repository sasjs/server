/**
 * What this browser has seen this user open, for the home dashboard.
 *
 * "Recently used" is state, not a setting, and the server keeps no per-user
 * history - so it lives in localStorage, per username, exactly as Studio's
 * last-file does: two accounts on one browser must not inherit each other's
 * history. Every call tolerates storage that is missing or throws (private mode,
 * storage disabled), because a dashboard that cannot remember is still a
 * dashboard.
 *
 * The keys are namespaced so the dashboard's "clear" control can remove this
 * history and nothing else - not the colour scheme, not Studio's open file.
 */

const PREFIX = 'sasjs-dashboard'

const key = (kind: string, username: string): string =>
  `${PREFIX}:${kind}:${String(username ?? '')
    .trim()
    .toLowerCase()}`

/** How many entries a list keeps. Enough to fill a row, short enough to read. */
const LIMIT = 6

const read = (storageKey: string): string => {
  try {
    return localStorage.getItem(storageKey) ?? ''
  } catch {
    return ''
  }
}

const write = (storageKey: string, value: string): void => {
  try {
    if (!value) localStorage.removeItem(storageKey)
    else localStorage.setItem(storageKey, value)
  } catch {
    // Storage unavailable: nothing is remembered, and nothing breaks.
  }
}

const readList = <T>(storageKey: string): T[] => {
  const raw = read(storageKey)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

const unshiftCapped = <T>(
  list: T[],
  entry: T,
  same: (a: T) => boolean
): T[] => {
  const without = list.filter((item) => !same(item))
  return [entry, ...without].slice(0, LIMIT)
}

/** An app the user opened, by the route or URL the tile goes to. */
export interface RecentApp {
  title: string
  subtitle?: string
  logo?: string | null
  to?: string
  href?: string
  /** ISO timestamp of the last open. */
  at: string
}

/** A drive file the user opened in Studio. */
export interface RecentFile {
  path: string
  /** ISO timestamp of the last open. */
  at: string
}

export const recallRecentApps = (username: string): RecentApp[] =>
  readList<RecentApp>(key('apps', username))

export const rememberRecentApp = (
  username: string,
  app: Omit<RecentApp, 'at'>
): void => {
  if (!username || !app.title) return

  const target = app.href ?? app.to ?? ''
  if (!target) return

  const list = recallRecentApps(username)

  write(
    key('apps', username),
    JSON.stringify(
      unshiftCapped(
        list,
        { ...app, at: new Date().toISOString() },
        (item) => (item.href ?? item.to ?? '') === target
      )
    )
  )
}

export const recallRecentFiles = (username: string): RecentFile[] =>
  readList<RecentFile>(key('files', username))

export const rememberRecentFile = (username: string, path: string): void => {
  const filePath = String(path ?? '').trim()
  if (!username || !filePath) return

  const list = recallRecentFiles(username)

  write(
    key('files', username),
    JSON.stringify(
      unshiftCapped(
        list,
        { path: filePath, at: new Date().toISOString() },
        (item) => item.path === filePath
      )
    )
  )
}

/**
 * The sign-ins this browser has seen for this user, newest first.
 *
 * Kept as a short list rather than one value because the dashboard shows the
 * PREVIOUS sign-in: a single "last sign-in" written at login would always read
 * "now", which tells the reader nothing.
 */
export const recallSignIns = (username: string): string[] =>
  readList<string>(key('signins', username))

export const rememberSignIn = (username: string): void => {
  if (!username) return

  write(
    key('signins', username),
    JSON.stringify(
      [new Date().toISOString(), ...recallSignIns(username)].slice(0, 5)
    )
  )
}

/**
 * Forgets this user's dashboard history - apps, files and sign-ins.
 *
 * Studio's remembered file is deliberately left alone: it is the editor's
 * state, and clearing the dashboard is not a request to change where the editor
 * opens next.
 */
export const clearDashboardHistory = (username: string): void => {
  if (!username) return

  for (const kind of ['apps', 'files', 'signins'])
    write(key(kind, username), '')
}
