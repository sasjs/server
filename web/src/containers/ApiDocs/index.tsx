import FramedPane from '../../components/framedPane'
import { apiHost, apiDocsUrl } from '../../utils/host'

/**
 * Where the Swagger UI page is served.
 *
 * Its stylesheet, bundle and preset are files beside it, so the page and its
 * assets travel as one folder - the API answers `/api/*` itself, which is why
 * this is not `/api`.
 */
export const API_PANE = '/api-assets/'

/**
 * The REST API's documentation, inside the app.
 *
 * On a server that is Swagger UI at `API_PANE`, and it is the real page: `Try it
 * out` works because the frame's calls reach the server that answered it. A
 * browser host has no server and no Swagger UI; its build writes a console at
 * `<base>/api/`, which documents the API the worker answers - see `apiDocsUrl`.
 *
 * Either way the frame is same-origin, which is what the API's own headers
 * require (X-Frame-Options: SAMEORIGIN, `frame-ancestors 'self'`), and either way
 * it keeps the header and tabs in place, so following a link to the API stays in
 * the application.
 *
 * The theme sync is Swagger UI's own: only that page carries the rules it drives.
 * The console's stylesheet is dark-only - one palette at `:root`, no
 * `prefers-color-scheme` and no dark-mode class - so syncing it would do nothing
 * and claim otherwise. It is left unsynced until that stylesheet grows a light
 * theme.
 */
const ApiDocs = () => (
  <FramedPane
    src={apiDocsUrl(API_PANE)}
    title="SASjs Server API documentation"
    openLabel="Open the API documentation in a new tab"
    blockedHeading="The API documentation cannot be shown here"
    themeSync={apiHost() === 'browser' ? 'none' : 'swagger-ui'}
    refusalHelp={
      <>
        This server's Content-Security-Policy refuses to frame its own API
        documentation, so the screen has nothing to draw. An administrator can
        allow it by adding
        <code> frame-src 'self' </code>
        to the policy, or by removing HELMET_CSP_CONFIG_PATH so the server's own
        defaults apply.
      </>
    }
    unavailableHelp={
      <>
        The documentation page did not load in time. The policy allows this
        frame, so the cause is elsewhere: a slow first request, a proxy in front
        of the server, or a build that carries no API page.
      </>
    }
  />
)

export default ApiDocs
