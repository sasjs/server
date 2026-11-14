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

/**
 * Where the API documentation is served for this page.
 *
 * A server serves Swagger UI, at its own path, and it is the real page: `Try it
 * out` works because the frame's calls reach the server that answered it.
 *
 * A browser host serves a console instead - `sasjs/cli`'s mock build writes one at
 * `<base>/api/`: the route table the worker answers, one form per operation - so
 * that is what documents the API that is running. There is no other page to show.
 *
 * The folder is the site's, and the page does not carry it in its markup: the
 * worker does. A mock site registers its worker at `<base>/sw.js` (the loader
 * derives everything else from the same place), so the controller's own script URL
 * is the one statement of the base that exists at runtime - and a page with no
 * controller is one whose API answers nothing, where the origin root is the only
 * answer worth giving.
 */
export const apiDocsUrl = (serverPath: string): string => {
  if (apiHost() === 'server') return serverPath
  if (typeof navigator === 'undefined') return '/api/'

  const script = navigator.serviceWorker?.controller?.scriptURL
  if (!script) return '/api/'

  const path = new URL(script).pathname
  return path.replace(/sw\.js$/, '') + 'api/'
}
