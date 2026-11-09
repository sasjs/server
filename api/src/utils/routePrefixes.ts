/**
 * The two spellings each mounted router answers to.
 *
 * The CANONICAL spelling is the one the permission model speaks: the route
 * inventory (`getAuthorizedRoutes`) and every `Permission.path` record in the
 * database are written `/SASjsApi/...` and `/AppStream/...`. A grant created
 * before the short URLs existed therefore keeps deciding the same request,
 * because the gate canonicalizes the request before it looks a rule up - the
 * short spelling is a URL, not a second vocabulary.
 *
 * The PUBLIC spelling is what a reader types and what the interface links to:
 * `/api` and `/app`. Both spellings are served, and neither redirects to the
 * other: `@sasjs/adapter` and existing bookmarks address the canonical
 * spelling directly, and a redirect on an API route would turn every request
 * into an extra round trip.
 */
export const API_PREFIX = '/SASjsApi'
export const API_ALIAS = '/api'

export const APP_STREAM_PREFIX = '/AppStream'
export const APP_STREAM_ALIAS = '/app'

/** Every prefix the API router is mounted at. */
export const API_PREFIXES = [API_PREFIX, API_ALIAS]

/** Every prefix the App Stream router is mounted at. */
export const APP_STREAM_PREFIXES = [APP_STREAM_PREFIX, APP_STREAM_ALIAS]

/**
 * The canonical spelling of a mounted prefix, given a path or a baseUrl.
 *
 * Express records the prefix the client actually used, so a request on
 * `/api/...` arrives with `baseUrl === '/api'` at the mount - but the permission
 * gate runs on the SUB-mounted routers, so by then `baseUrl` is `/api/code`, and
 * `/api/drive` (see `routes/api/index.ts`). Matching the whole string exactly
 * therefore canonicalised nothing in the one place that decides access, and the
 * path built by `getPath` (`/api/code/execute`) matched no route in the
 * inventory - which makes `isAuthorizingRoute` false, and false there means
 * "skip the permission check", not "no grant needed".
 *
 * So the FIRST PATH SEGMENT is what is canonicalised, whatever follows it:
 * `/api/code/execute` becomes `/SASjsApi/code/execute` and `/app/Mario/` becomes
 * `/AppStream/Mario/`. The comparison is case-insensitive for the same reason
 * Express's mounting is: `/API/info` reaches the API router, so it has to reach
 * the same permission answer.
 */
export const canonicalPrefix = (path: string): string => {
  const lower = path.toLowerCase()

  for (const [alias, canonical] of [
    [API_ALIAS, API_PREFIX],
    [APP_STREAM_ALIAS, APP_STREAM_PREFIX]
  ]) {
    if (lower === alias) return canonical
    if (lower.startsWith(`${alias}/`))
      return canonical + path.slice(alias.length)
  }

  return path
}
