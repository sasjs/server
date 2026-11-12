/**
 * Takes this browser's cached copy of the site off it.
 *
 * The demonstration site is answered by a service worker - that is how it runs
 * with no server behind it - and that is also why a browser can hold an old build
 * for days: the worker answers the page from its own cache, so a visit keeps
 * serving the version it stored and an ordinary reload does not replace it.
 *
 * Unregistering the worker and deleting the caches is what a hard reload does for
 * one tab. Doing it from the page means a reader can fix it without knowing what a
 * service worker is, which is the point of the button.
 *
 * The reload at the end is part of the fix rather than a courtesy: this page is
 * already in memory, and the first request the browser makes afterwards has to be
 * one the worker no longer answers.
 */
export interface CacheHost {
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
  /** The address the page is on now, so the next request can differ from it. */
  href: string
  /** Where to send the browser once the worker and the caches are away. */
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

/**
 * The value, or `undefined` when the call was refused.
 *
 * Every step here talks to an API a browser may forbid - the worker in a
 * sandboxed frame, Cache Storage under a policy - and each one is guarded on its
 * own so that a refusal costs one item rather than the rest of the sweep.
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

export interface CacheWipe {
  /** How many service worker registrations were removed. */
  workers: number
  /** How many named caches were deleted. */
  caches: number
}

/**
 * The site's workers and the caches they filled, gone, then a fresh page.
 *
 * This is the browser's copy of the SITE, not of the application's data:
 * `localStorage` (where the dashboard history lives), `sessionStorage` and any
 * IndexedDB are untouched, which is why the history button remains its own.
 *
 * Every refusal is caught where it happens - inside each loop, and around each
 * phase - because half a wipe that stops is a page that looks stuck: a browser
 * that refuses one unregister - a sandboxed frame, a policy - must not leave the
 * other registrations standing, and must still leave for a fresh page.
 */
export const clearCachedSite = async (host: CacheHost): Promise<CacheWipe> => {
  const wiped: CacheWipe = { workers: 0, caches: 0 }

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

  host.navigate(cacheBust(host.href, Date.now()))

  return wiped
}
