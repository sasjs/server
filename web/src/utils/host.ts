/**
 * Where this page's `/SASjsApi` answers come from.
 *
 * A browser host is a static site whose API is answered by a service worker
 * inside the page: no server, no SAS binary, a drive built into the site and a
 * seeded identity. The server is a process. The two answer the same routes, so
 * nothing in the API can tell them apart - the host has to say, and it does: the
 * mock site's loader injects `<meta name="sasjs-host" content="browser">` when
 * it rewrites the page, which it is already doing to point the page at itself.
 *
 * Absence of the tag means the server answered the page. The service-worker
 * check is a fallback for a site emitted before the tag existed.
 */
export type ApiHost = 'browser' | 'server'

export const apiHost = (): ApiHost => {
  if (typeof document === 'undefined') return 'server'

  const stated = document
    .querySelector('meta[name="sasjs-host"]')
    ?.getAttribute('content')
    ?.trim()
    .toLowerCase()

  if (stated) return stated === 'browser' ? 'browser' : 'server'

  return typeof navigator !== 'undefined' && navigator.serviceWorker?.controller
    ? 'browser'
    : 'server'
}
