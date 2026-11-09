import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import FramedPane from '../../components/framedPane'

/**
 * Where the built documentation site is served.
 *
 * A path of its own, beside the interface rather than under it: the reader's
 * address is `/docs/...` - the app's route, which draws this pane - and the
 * pages themselves live here. Serving them under `/docs` would put the frame
 * and the screen it fills at the same address, and the frame would load the
 * app that contains it.
 */
export const DOCS_PANE = '/documentation'

/** The app's route for a page of the documentation. */
export const DOCS_ROUTE = '/docs'

const Docs = () => {
  const navigate = useNavigate()
  const { pathname, search, hash } = useLocation()

  const rest = pathname.slice(DOCS_ROUTE.length) || '/'
  const src = `${DOCS_PANE}${rest}${search}${hash}`

  /**
   * The frame navigated - the reader followed a link or used the docs' own
   * search - so the address bar follows.
   *
   * `replace`, not a new entry: the frame keeps its own history, and pushing
   * here would make Back retrace every link inside the page before leaving it.
   * The entry that matters - `/docs/guides/settings/` - is what a reload and a
   * bookmark use, and both work because it is the URL.
   */
  const onNavigate = useCallback(
    (framedPath: string) => {
      if (!framedPath.startsWith(DOCS_PANE)) return

      const inner = framedPath.slice(DOCS_PANE.length) || '/'

      navigate(`${DOCS_ROUTE}${inner}`, { replace: true })
    },
    [navigate]
  )

  return (
    <FramedPane
      src={src}
      onNavigate={onNavigate}
      title="SASjs Server documentation"
      openLabel="Open the documentation in a new tab"
      blockedHeading="The documentation cannot be shown here"
      themeSync="material"
      refusalHelp={
        <>
          This server's Content-Security-Policy refuses to frame its own
          documentation, so the screen has nothing to draw. An administrator can
          allow it by adding
          <code> frame-src 'self' </code>
          to the policy, or by removing HELMET_CSP_CONFIG_PATH so the server's
          own defaults apply.
        </>
      }
      unavailableHelp={
        <>
          The documentation did not load in time. A development build that
          skipped <code>npm run docs:build</code> carries no pages; otherwise
          the cause is a slow first request or a proxy in front of the server.
        </>
      }
    />
  )
}

export default Docs
