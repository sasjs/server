/**
 * Routes the server gates behind a Permission, spelled exactly as the server's
 * inventory spells them (`api/src/utils/getAuthorizedRoutes.ts`).
 *
 * The spelling matters: the interface asks the server which of its routes this
 * caller holds, and compares the answer to these strings. A mismatch would hide
 * an entry the caller may use, so they live in one place rather than being
 * repeated at each call site.
 */

/** Ad hoc code execution, which is what the Studio tab runs. */
export const STUDIO_ROUTE = '/SASjsApi/code/execute'

/** The App Stream landing page, and the prefix each published app sits under. */
export const APP_STREAM_ROUTE = '/AppStream'

/**
 * Publishing and unpublishing an app: `POST /SASjsApi/drive/deploy` writes the
 * registry entry, `DELETE` on the same route removes it. One route, so a caller
 * holding the grant to publish holds the one to take it back down.
 */
export const DEPLOY_ROUTE = '/SASjsApi/drive/deploy'
