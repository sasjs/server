import FramedPane from '../../components/framedPane'
import { apiHost } from '../../utils/host'

/**
 * The REST API's documentation, inside the app.
 *
 * Swagger UI at /SASjsApi is a static page served by the API - it carries its
 * own stylesheet and its own scripts - so the app shows it in a frame instead of
 * re-rendering it. A frame keeps the header and tabs in place, which is what
 * makes following a link to the API stay in the application, and Back returns to
 * the previous screen the way it does anywhere else.
 *
 * The path is relative, so the frame is same-origin with the page that carries
 * it: in a deployment the API serves the app, and `npm start` proxies the path
 * (webpack.dev.ts). That is what the API's own headers require - helmet sends
 * X-Frame-Options: SAMEORIGIN and `frame-ancestors 'self'` - and no policy
 * change is needed to host it.
 *
 * A browser host has no /SASjsApi to serve a page from - that path is the API,
 * answered by a service worker - so the site carries a copy of the same Swagger
 * UI at /api-docs. Its `Try it out` calls still go to /SASjsApi, and the worker
 * answers them: the page documents the API that is actually running.
 */
const ApiDocs = () => (
  <FramedPane
    src={apiHost() === 'browser' ? '/api-docs/' : '/SASjsApi/'}
    title="SASjs Server API documentation"
    openLabel="Open the API documentation"
    blockedHeading="The API documentation cannot be shown here"
    themeSync="swagger-ui"
    refusalHelp={
      apiHost() === 'browser' ? (
        <>
          This site carries its API documentation at
          <code> /api-docs </code>
          and it did not load. Reload the page; if it still does not open, the
          site was published without it.
        </>
      ) : (
        <>
          This server's Content-Security-Policy refuses to frame its own
          documentation page, so the screen has nothing to draw. The page itself
          is served normally - it opens in a new tab - and an administrator can
          allow it by adding
          <code> frame-src 'self' </code>
          to the policy, or by removing HELMET_CSP_CONFIG_PATH so the server's
          own defaults apply.
        </>
      )
    }
    unavailableHelp={
      <>
        The documentation page did not load in time. The policy allows this
        frame, so the cause is elsewhere: a slow first request, a proxy in front
        of the server, or a header of its own that refuses framing. The page
        still opens in a new tab.
      </>
    }
  />
)

export default ApiDocs
