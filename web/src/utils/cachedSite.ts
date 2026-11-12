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

export interface CacheWipe {
  /** How many service worker registrations were removed. */
  workers: number
  /** How many named caches were deleted. */
  caches: number
}

/**
 * Everything the browser kept for this site, gone, then a fresh page.
 *
 * Each step is guarded on its own: a browser that refuses one - a page in a
 * sandboxed frame can refuse the worker - must still have the other attempted and
 * still be reloaded, because half a wipe that stops is a page that looks stuck.
 */
export const clearCachedSite = async (host: CacheHost): Promise<CacheWipe> => {
  const wiped: CacheWipe = { workers: 0, caches: 0 }

  try {
    const registrations = (await host.serviceWorker?.getRegistrations()) ?? []

    for (const registration of registrations) {
      if (await registration.unregister()) wiped.workers++
    }
  } catch {
    // refused: the reload below is still the reader's way out
  }

  try {
    const names = (await host.caches?.keys()) ?? []

    for (const name of names) {
      if (await host.caches?.delete(name)) wiped.caches++
    }
  } catch {
    // as above
  }

  host.navigate(cacheBust(host.href, Date.now()))

  return wiped
}
