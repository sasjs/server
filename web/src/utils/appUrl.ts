/**
 * An app's link, preferring the name a person can read.
 *
 * An app answers on two URLs: `/app/<id>/`, which is canonical and survives a
 * rename, and `/app/<name>/`, which is readable and shareable. The name form
 * only works when one app holds that name - the App Stream refuses an ambiguous
 * lookup rather than guessing - so the id is used wherever the listing shows a
 * name twice, and for a name a static host could not serve as a path segment (a
 * label derived from a folder may carry a space, which is a label rather than an
 * address).
 *
 * The rule lives here rather than in the screen because the dashboard links to
 * apps as well, and two copies of a precedence rule are one copy that drifts.
 */

/** An app as the listing describes it. */
export interface AppLink {
  id: string
  name: string
}

/**
 * Where the App Stream's listing is requested.
 *
 * The canonical spelling, which the server answers on both prefixes and the
 * browser-hosted build answers on this one: `/AppStream` and the short `/app`
 * are one surface, and the mock host answers `/AppStream/apps.json` today. It is
 * stated once so the screens that draw apps and the search that finds them cannot
 * ask different addresses - a listing address that drifts between callers is a
 * screen that silently shows nothing.
 *
 * Requested through the shared axios instance, never a bare `fetch`: that
 * instance carries `baseURL: apiBaseUrl` (the API's origin under `npm start`,
 * which serves the build otherwise) and `withCredentials`, so the request
 * reaches the API from the dev server and carries the session cookie.
 */
export const APPS_LISTING = '/AppStream/apps.json'

/**
 * The segments the App Stream answers itself, before any app is looked up - a
 * name that collides with one of these can never open an app.
 */
const RESERVED = ['apps.json', 'index.html']

/** Whether a stated name can be a path segment without percent-encoding. */
const isSegment = (name: string): boolean =>
  /^[A-Za-z0-9][A-Za-z0-9._~-]*$/.test(name) &&
  !RESERVED.includes(name.toLowerCase())

/** Whether more than one app in this listing carries the name. */
const isShared = (name: string, apps: AppLink[]): boolean =>
  apps.filter((app) => app.name.toLowerCase() === name.toLowerCase()).length > 1

/**
 * The URL to open an app at.
 *
 * `apps` is the listing the entry came from - the uniqueness question is about
 * what a caller can see, which is the same list the tiles were drawn from.
 */
export const appHref = (app: AppLink, apps: AppLink[] = [app]): string =>
  isSegment(app.name) && !isShared(app.name, apps)
    ? `/app/${app.name}/`
    : `/app/${app.id}/`
