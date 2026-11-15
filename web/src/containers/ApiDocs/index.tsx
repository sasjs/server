import { useEffect, useState } from 'react'

import FramedPane from '../../components/framedPane'
import { apiDocsTarget, apiHost, consolePresent } from '../../utils/host'

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
 * `<base>/api-console/`, which documents the API the worker answers - see
 * `apiDocsTarget`.
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
const ApiDocs = () => {
  const [target, setTarget] = useState(() => apiDocsTarget(API_PANE))
  const [absent, setAbsent] = useState(false)

  /**
   * A browser host frames a page its build wrote, and a build can leave it out -
   * `mockApi: false`, or a project that already ships files at that folder. The
   * pane's own timeout would then report a page that never arrived, which reads as
   * a slow proxy: ask once whether it is there so the screen can say what is true.
   *
   * The address is only the console's once the site's worker controls the page. On
   * a first visit it is the origin root, and a 404 there is a path this site never
   * had - so the ask is repeated when the worker takes control, which is when the
   * answer becomes meaningful.
   */
  useEffect(() => {
    if (apiHost() !== 'browser') return

    let live = true
    const evaluate = () => {
      const next = apiDocsTarget(API_PANE)
      setTarget(next)
      consolePresent(next.url, next.fromWorker).then((present) => {
        if (live) setAbsent(!present)
      })
    }

    evaluate()

    const worker =
      typeof navigator === 'undefined' ? undefined : navigator.serviceWorker
    worker?.addEventListener?.('controllerchange', evaluate)

    return () => {
      live = false
      worker?.removeEventListener?.('controllerchange', evaluate)
    }
  }, [])

  return (
    <FramedPane
      src={target.url}
      absent={absent}
      absentHeading="This build carries no API console"
      absentHelp={
        <>
          The site was built without one, so there is no page to show here. A
          build leaves the console out when it sets <code>mockApi: false</code>{' '}
          in the target's <code>streamConfig</code>, or when the project already
          ships files at <code>api-console/</code>.
        </>
      }
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
          to the policy, or by removing HELMET_CSP_CONFIG_PATH so the server's
          own defaults apply.
        </>
      }
      unavailableHelp={
        <>
          The documentation page did not load in time. The policy allows this
          frame, so the cause is elsewhere: a slow first request, or a proxy in
          front of the server.
        </>
      }
    />
  )
}

export default ApiDocs
