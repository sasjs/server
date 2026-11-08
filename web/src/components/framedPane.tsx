import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material'
import { OpenInNew } from '@mui/icons-material'

import { useColorMode } from '../utils/hooks'

/** The header's dense toolbar, which this pane sits below. */
const HEADER_HEIGHT = 48
const TITLE_BAR_HEIGHT = 40

/**
 * How long the frame is given before an empty pane is read as a refusal.
 *
 * Every page this pane hosts is a document served from the same origin, so it
 * either arrives quickly or it is not coming: a deployment whose policy refuses
 * the frame issues no request at all, and nothing on the page reports an error.
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
export type BlockedReason = 'refused' | 'unavailable'

export interface FramedPaneProps {
  /** Same-origin path of the document to show. */
  src: string
  /** The heading in the pane's own title bar. */
  heading: string
  /** The iframe's accessible name. */
  title: string
  /** Label of the button offered when the frame cannot be drawn. */
  openLabel: string
  /** The heading shown when the frame cannot be drawn. */
  blockedHeading: string
  /** What the reader is told when the policy refuses the frame. */
  refusalHelp: ReactNode
  /** What the reader is told when the page never arrives. */
  unavailableHelp: ReactNode
  /**
   * Tell the framed document the app's colour scheme on load. True for pages
   * that carry both schemes and switch on a class (Swagger UI does); the docs
   * site follows the operating system's preference on its own, so it is off
   * there.
   */
  syncColorMode?: boolean
}

/**
 * A same-origin document, inside the app shell.
 *
 * Both documentation screens show a static page the server already serves -
 * Swagger UI at /SASjsApi and the MkDocs site at /docs - rather than
 * re-rendering it, so the header and tabs stay in place, Back returns to the
 * previous screen, and the page keeps its own search, navigation and anchors.
 *
 * A same-origin frame can still be refused, and then the pane would otherwise
 * be an empty rectangle with no explanation: a deployment whose
 * Content-Security-Policy states a `default-src` and no `frame-src` makes the
 * frame inherit that default, and a default narrower than the server's own
 * origin refuses it. The refusal is read from the document's own
 * `securitypolicyviolation` event, with a timeout as the backstop for anything
 * that blocks without raising one (an X-Frame-Options mismatch does not), and
 * the pane says which of the two happened.
 */
const FramedPane = ({
  src,
  heading,
  title,
  openLabel,
  blockedHeading,
  refusalHelp,
  unavailableHelp,
  syncColorMode = false
}: FramedPaneProps) => {
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
   * that serves the docs from elsewhere) is left as the server sent it.
   */
  const applyColorMode = useCallback(() => {
    if (!syncColorMode) return

    const doc = frameRef.current?.contentDocument
    if (!doc) return

    doc.documentElement.classList.toggle('dark-mode', colorMode === 'dark')
  }, [colorMode, syncColorMode])

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
    const paneUrl = new URL(src, window.location.href)
    const matchingPath = (pathname: string) =>
      pathname === paneUrl.pathname || pathname.startsWith(paneUrl.pathname)

    let timer: number | undefined

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

      if (blocked.origin !== paneUrl.origin) return

      if (!matchingPath(blocked.pathname)) return

      // The refusal is the better diagnosis, and a refused frame is exactly
      // the one that never fires a load event - so the backstop must not be
      // left armed to overwrite this ten seconds later.
      window.clearTimeout(timer)
      setBlocked('refused')
    }

    document.addEventListener('securitypolicyviolation', onViolation)

    // The backstop for a refusal that raises no event - an X-Frame-Options
    // mismatch raises none - and for a page that never arrives. The frame
    // reports its own load, so a slow proxy is not mistaken for a refusal.
    timer = window.setTimeout(() => {
      if (!loadedRef.current) setBlocked('unavailable')
    }, FRAME_TIMEOUT_MS)

    return () => {
      document.removeEventListener('securitypolicyviolation', onViolation)
      window.clearTimeout(timer)
    }
  }, [src])

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
        <Typography variant="subtitle2">{heading}</Typography>
        <Box sx={{ flexGrow: 1 }} />
        {/* The toolbar's icon names the tab it opens, so it stays distinct
            from the button in the fallback below - two links with one
            accessible name are one control to a reader and two to a locator. */}
        <Tooltip title={`${openLabel} in a new tab`}>
          <IconButton
            size="small"
            href={src}
            target="_blank"
            rel="noreferrer"
            aria-label={`${openLabel} in a new tab`}
          >
            <OpenInNew fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {blocked ? (
        <Box sx={{ p: 3, maxWidth: 640 }}>
          <Typography variant="subtitle1" gutterBottom>
            {blockedHeading}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {blocked === 'refused' ? refusalHelp : unavailableHelp}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            href={src}
            target="_blank"
            rel="noreferrer"
            startIcon={<OpenInNew />}
            sx={{ mt: 1 }}
          >
            {openLabel}
          </Button>
        </Box>
      ) : (
        <Box
          component="iframe"
          title={title}
          src={src}
          ref={frameRef}
          onLoad={handleFrameLoad}
          sx={{ flexGrow: 1, width: '100%', border: 0, display: 'block' }}
        />
      )}
    </Box>
  )
}

export default FramedPane
