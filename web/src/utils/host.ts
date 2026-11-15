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
 * `<base>/api-console/`: the route table the worker answers, one form per operation - so
 * that is what documents the API that is running. There is no other page to show.
 *
 * The folder is the site's, and the page does not carry it in its markup: the
 * worker does. A mock site registers its worker at `<base>/sw.js` (the loader
 * derives everything else from the same place), so the controller's own script URL
 * is the one statement of the base that exists at runtime - and a page with no
 * controller is one whose API answers nothing, where the origin root is the only
 * answer worth giving.
 */
export interface ApiDocsTarget {
  /** Same-origin path of the console the pane should frame. */
  url: string
  /**
   * Whether `url` came from the worker, or is the origin root guessed.
   *
   * It decides what a `404` means. A path derived from the controller is what the
   * site registered, so a 404 there is the build saying it wrote no console. The
   * root fallback is a guess made before the worker took control - a first visit to
   * a site published in a folder reaches the pane before `clients.claim()` - and a
   * 404 against it says nothing about the site's own console.
   */
  fromWorker: boolean
}

/** The console the pane would frame, and how sure the address is. */
export const apiDocsTarget = (serverPath: string): ApiDocsTarget => {
  if (apiHost() === 'server') return { url: serverPath, fromWorker: true }
  if (typeof navigator === 'undefined')
    return { url: '/api-console/', fromWorker: false }

  const script = navigator.serviceWorker?.controller?.scriptURL
  if (!script) return { url: '/api-console/', fromWorker: false }

  const path = new URL(script).pathname
  return { url: path.replace(/sw\.js$/, '') + 'api-console/', fromWorker: true }
}

/**
 * Whether a probe's answer means the build wrote no console.
 *
 * Only a `404` or a `410` does - anything else is a page that is merely
 * unreachable, and saying "this build carries no console" about one sends the
 * reader to the wrong place.
 *
 * And only when the address was the worker's: the origin-root fallback is a guess
 * made before the worker took control, so a 404 against it is the absence of a
 * path this site never had, not of the console it wrote under its own folder.
 */
export const consoleAbsent = (status: number, fromWorker: boolean): boolean =>
  fromWorker && (status === 404 || status === 410)

/**
 * Whether the page at `url` is there at all.
 *
 * A browser host frames the console its build wrote, but a build may not have
 * written one: `mockApi: false` leaves it out, and so does a project that already
 * ships files at that folder. The pane cannot tell a missing page from a slow one
 * after the fact - both leave an empty frame - so it asks first, once.
 *
 * `fromWorker` is the target's own word on whether the address can be trusted to
 * mean something, and a probe that cannot conclude answers "there" so the frame is
 * left to report what it finds.
 */
export const consolePresent = async (
  url: string,
  fromWorker: boolean
): Promise<boolean> => {
  if (!fromWorker) return true
  if (typeof fetch !== 'function') return true

  try {
    const response = await fetch(url, { cache: 'no-store' })
    return !consoleAbsent(response.status, fromWorker)
  } catch (e) {
    return true
  }
}
