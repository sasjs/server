/**
 * Takes this browser's copy of the site off it - answers, storage and all.
 *
 * The demonstration site is answered by a service worker, and the application
 * keeps its own state beside it: settings, the last file opened, the dashboard's
 * recent lists. A browser that has visited before can therefore be wrong in more
 * than one place - a worker serving an old shell, a cached bundle from before the
 * last release, a setting stored by a build that stored it differently - and an
 * ordinary reload fixes none of it, because a reload asks the same caches the same
 * questions.
 *
 * So this is one action for the whole of it, and the point of having it in the page
 * is that a reader should not need to know what a service worker, a cache or an
 * IndexedDB database is in order to get a clean start:
 *
 *   - every service worker registration, unregistered
 *   - every named Cache Storage entry, deleted
 *   - every IndexedDB database, deleted
 *   - `localStorage` and `sessionStorage`, cleared
 *
 * The last two are per ORIGIN, not per application: on the demonstration site the
 * origin is the site, and elsewhere this button is not shown at all (see the
 * dashboard). That is also why it does not replace the "Clear this browser's
 * history" button, which remains for a server host and for the one job of emptying
 * the dashboard's lists.
 *
 * What it cannot do, because no page can: reach the browser's HTTP cache, or a
 * worker whose script is still the only copy of the site. Hence the navigation at
 * the end to an address the browser has never asked for - a query string is the
 * one cache key a page can change - after which the loader registers a fresh
 * worker and the app starts from nothing.
 */
export interface SiteHost {
  serviceWorker?: {
    /* Readonly, because that is what the DOM hands back: `getRegistrations`
       answers a frozen list, and asking for a mutable one fails to type-check
       against the container the page actually has. */
    getRegistrations(): Promise<
      ReadonlyArray<{ unregister(): Promise<boolean> }>
    >
  }
  caches?: {
    keys(): Promise<string[]>
    delete(name: string): Promise<boolean>
  }
  /** IndexedDB, which has no way to enumerate or drop its databases in a loop-free
   * form - the adapter in `browserSite` is where that difference is paid. */
  databases?: {
    list(): Promise<Array<string | undefined>>
    delete(name: string): Promise<unknown>
  }
  localStorage?: { clear(): void }
  sessionStorage?: { clear(): void }
  /** The address the page is on now, so the next request can differ from it. */
  href: string
  /** Where to send the browser once everything is away. */
  navigate: (url: string) => void
}

/**
 * The same page, at an address the browser has never asked for.
 *
 * Removing the worker and the caches is not enough on a static host: the shell
 * and its hashed bundles are ordinary HTTP responses, held in the browser's own
 * cache with whatever lifetime the host set - a minute on some, a day on others.
 * A plain reload revalidates them, or does not; a new query string cannot, so the
 * next load is a request the browser has nothing to answer with.
 */
export const cacheBust = (href: string, stamp: number): string => {
  const url = new URL(href)

  url.searchParams.set('sasjs-cache-bust', String(stamp))

  return url.toString()
}

export interface SiteWipe {
  workers: number
  caches: number
  databases: number
  /** How many of `localStorage` and `sessionStorage` were cleared (0 to 2). */
  stores: number
}

/**
 * The value, or `undefined` when the call was refused.
 *
 * Every step here talks to an API a browser may forbid - the worker in a
 * sandboxed frame, storage under a policy - and each one is guarded on its own so
 * that a refusal costs one item rather than the rest of the sweep.
 */
const settle = async <T>(
  call: () => T | Promise<T>
): Promise<T | undefined> => {
  try {
    return await call()
  } catch {
    return undefined
  }
}

/** Whether a store was cleared - `settle` cannot tell, since `clear` answers nothing. */
const cleared = async (store?: { clear(): void }): Promise<boolean> => {
  if (!store) return false

  return (
    (await settle(() => {
      store.clear()

      return true
    })) === true
  )
}

/**
 * Everything the site left in this browser, gone, then a fresh page.
 *
 * Every refusal is caught where it happens - inside each loop, and around each
 * phase - because half a wipe that stops is a page that looks stuck: a browser
 * that refuses one unregister - a sandboxed frame, a policy - must not leave the
 * other registrations standing, and must still leave for a fresh page.
 */
export const clearSite = async (host: SiteHost): Promise<SiteWipe> => {
  const wiped: SiteWipe = {
    workers: 0,
    caches: 0,
    databases: 0,
    stores: 0
  }

  const registrations =
    (await settle(() => host.serviceWorker?.getRegistrations())) ?? []

  for (const registration of registrations) {
    // one refusal must not abandon the registrations after it
    if (await settle(() => registration.unregister())) wiped.workers++
  }

  const names = (await settle(() => host.caches?.keys())) ?? []

  for (const name of names) {
    if (await settle(() => host.caches?.delete(name))) wiped.caches++
  }

  const databases = (await settle(() => host.databases?.list())) ?? []

  for (const name of databases) {
    if (!name) continue
    // `deleteDatabase` answers a request rather than a promise, so the adapter
    // resolves it; what matters here is that a blocked delete does not stop the
    // ones after it.
    if ((await settle(() => host.databases?.delete(name))) !== undefined)
      wiped.databases++
  }

  // Clearing is the whole of the two stores this page can reach: it is per
  // origin, and on the site this button belongs to the origin is the site.
  if (await cleared(host.localStorage)) wiped.stores++
  if (await cleared(host.sessionStorage)) wiped.stores++

  host.navigate(cacheBust(host.href, Date.now()))

  return wiped
}

/**
 * The host, read from the browser the page is running in.
 *
 * Kept here rather than in the dashboard so that the awkward parts - the request
 * object IndexedDB answers with, the possibility that a browser has no `caches` at
 * all - are in one place, next to the tests that drive them.
 */
export const browserSite = (): SiteHost => ({
  serviceWorker: globalThis.navigator?.serviceWorker,
  caches: globalThis.caches,
  databases:
    typeof globalThis.indexedDB === 'undefined'
      ? undefined
      : {
          list: async () =>
            (await globalThis.indexedDB.databases()).map((db) => db.name),
          delete: (name: string) =>
            new Promise<void>((resolve) => {
              // Every outcome resolves: a blocked delete (another tab holds the
              // database) is not a reason to leave the page half-wiped.
              const request = globalThis.indexedDB.deleteDatabase(name)

              request.onsuccess = () => resolve()
              request.onerror = () => resolve()
              request.onblocked = () => resolve()
            })
        },
  localStorage: globalThis.localStorage,
  sessionStorage: globalThis.sessionStorage,
  href: window.location.href,
  navigate: (url) => window.location.replace(url)
})
