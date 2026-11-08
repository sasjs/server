import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material'
import { OpenInNew } from '@mui/icons-material'

import { useColorMode } from '../../utils/hooks'

/** The header's dense toolbar, which this pane sits below. */
const HEADER_HEIGHT = 48
const TITLE_BAR_HEIGHT = 40

/**
 * How long the frame is given before an empty pane is read as a refusal.
 *
 * The page is a static document served from the same origin, so it either
 * arrives quickly or it is not coming: a deployment whose policy refuses the
 * frame issues no request at all, and nothing on the page reports an error.
 */
const FRAME_TIMEOUT_MS = 10000

/**
 * Why the pane has nothing to draw.
 *
 * The two causes need different remedies, so the state carries the cause rather
 * than a boolean: `refused` is a Content-Security-Policy decision, which the
 * operator can change, and `unavailable` is the page not arriving at all - a
 * slow first request, a proxy, or a framing header of its own - where telling
 * them to edit the policy sends them to the wrong place.
 */
type BlockedReason = 'refused' | 'unavailable'

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
 * A same-origin frame can still be refused, and then the pane would otherwise
 * be an empty rectangle with no explanation: a deployment whose
 * Content-Security-Policy states a `default-src` and no `frame-src` makes the
 * frame inherit that default, and a default narrower than the server's own
 * origin refuses it. The refusal is read from the document's own
 * `securitypolicyviolation` event, with a timeout as the backstop for anything
 * that blocks without raising one (an X-Frame-Options mismatch does not), and
 * the pane says so and offers the link instead.
 */
const ApiDocs = () => {
  const src = '/SASjsApi/'
  const [colorMode] = useColorMode()
  const [blocked, setBlocked] = useState<BlockedReason | null>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  /** Set by the frame's own load event; read by the refusal backstop. */
  const loadedRef = useRef(false)

  /**
   * Swagger UI carries both schemes and switches on `html.dark-mode`, which its
   * own preset sets from the operating system's preference. The app has a
   * preference of its own, so the frame is told which one to draw: the frame is
   * same-origin, so its document is readable, and one that is not (a deployment
   * that serves the docs from elsewhere) is left as the API served it.
   */
  const applyColorMode = useCallback(() => {
    const doc = frameRef.current?.contentDocument
    if (!doc) return

    doc.documentElement.classList.toggle('dark-mode', colorMode === 'dark')
  }, [colorMode])

  /**
   * The frame's own load event, which is the one signal that the page arrived.
   *
   * The flag lives here rather than in `applyColorMode` because that callback is
   * also the mount effect: it runs before the frame has requested anything, so
   * setting the flag there leaves the backstop timer with nothing to report.
   */
  const handleFrameLoad = useCallback(() => {
    loadedRef.current = true

    applyColorMode()
  }, [applyColorMode])

  useEffect(applyColorMode, [applyColorMode])

  useEffect(() => {
    const docsUrl = new URL(src, window.location.href)

    /**
     * Only this pane's frame. `securitypolicyviolation` is raised on the
     * document for every frame in the app, so matching the directive alone
     * would flip this screen to "blocked" when some other embedded frame is
     * refused, and clear it never.
     */
    const onViolation = (event: SecurityPolicyViolationEvent) => {
      if (event.effectiveDirective !== 'frame-src' || !event.blockedURI) return

      let blocked: URL

      try {
        blocked = new URL(event.blockedURI)
      } catch (_) {
        return
      }

      if (
        blocked.origin !== docsUrl.origin ||
        blocked.pathname !== docsUrl.pathname
      )
        return

      setBlocked('refused')
    }

    document.addEventListener('securitypolicyviolation', onViolation)

    // The backstop for a refusal that raises no event - an X-Frame-Options
    // mismatch raises none - and for a page that never arrives. The frame
    // reports its own load, so a slow proxy is not mistaken for a refusal.
    const timer = window.setTimeout(() => {
      if (!loadedRef.current) setBlocked('unavailable')
    }, FRAME_TIMEOUT_MS)

    return () => {
      document.removeEventListener('securitypolicyviolation', onViolation)
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <Box
      sx={{
        position: 'fixed',
        top: HEADER_HEIGHT,
        right: 0,
        bottom: 0,
        left: 0,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          height: TITLE_BAR_HEIGHT,
          px: 2,
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Typography variant="subtitle2">API Explorer</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Open the API documentation in a new tab">
          <IconButton
            size="small"
            href={src}
            target="_blank"
            rel="noreferrer"
            aria-label="Open the API documentation in a new tab"
          >
            <OpenInNew fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {blocked ? (
        <Box sx={{ p: 3, maxWidth: 640 }}>
          <Typography variant="subtitle1" gutterBottom>
            The API documentation cannot be shown here
          </Typography>
          {blocked === 'refused' ? (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              This server's Content-Security-Policy refuses to frame its own
              documentation page, so the screen has nothing to draw. The page
              itself is served normally - it opens in a new tab - and an
              administrator can allow it by adding
              <code> frame-src 'self' </code>
              to the policy, or by removing HELMET_CSP_CONFIG_PATH so the
              server's own defaults apply.
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              The documentation page did not load in time. The policy allows
              this frame, so the cause is elsewhere: a slow first request, a
              proxy in front of the server, or a header of its own that refuses
              framing. The page still opens in a new tab.
            </Typography>
          )}
          <Button
            variant="outlined"
            size="small"
            href={src}
            target="_blank"
            rel="noreferrer"
            startIcon={<OpenInNew />}
            sx={{ mt: 1 }}
          >
            Open the API documentation
          </Button>
        </Box>
      ) : (
        <Box
          component="iframe"
          title="SASjs Server API documentation"
          src={src}
          ref={frameRef}
          onLoad={handleFrameLoad}
          sx={{ flexGrow: 1, width: '100%', border: 0, display: 'block' }}
        />
      )}
    </Box>
  )
}

export default ApiDocs
