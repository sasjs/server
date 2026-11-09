import FramedPane from '../../components/framedPane'

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
 * Swagger UI carries its own stylesheet, scripts and request builder, so the app
 * shows it in a frame rather than re-rendering it: `Try it out` works because
 * the page is the real one, and its calls go to `/SASjsApi` - answered by the
 * server, or by the worker on a browser host - so the page documents the API
 * that is actually running.
 *
 * The frame is same-origin, which is what the API's own headers require
 * (X-Frame-Options: SAMEORIGIN, `frame-ancestors 'self'`).
 */
const ApiDocs = () => (
  <FramedPane
    src={API_PANE}
    title="SASjs Server API documentation"
    openLabel="Open the API documentation in a new tab"
    blockedHeading="The API documentation cannot be shown here"
    themeSync="swagger-ui"
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
