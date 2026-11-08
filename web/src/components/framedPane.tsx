import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { OpenInNew } from '@mui/icons-material'

import { useColorMode } from '../utils/hooks'

/** The header's dense toolbar, which this pane sits below. */
const HEADER_HEIGHT = 48

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
   * How the framed document takes the app's colour scheme.
   *
   *   - `swagger-ui`: Swagger carries both schemes and switches on
   *     `html.dark-mode`, which is toggled here.
   *   - `material`: the MkDocs site resolves its own palette in its own script,
   *     before this pane can see the document - so the mode is posted to the
   *     page (which the docs' head script listens for) as well as written into
   *     Material's palette state for the next page.
   *   - `none`: the page follows the operating system on its own.
   */
  themeSync?: 'swagger-ui' | 'material' | 'none'
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
  title,
  openLabel,
  blockedHeading,
  refusalHelp,
  unavailableHelp,
  themeSync = 'none'
}: FramedPaneProps) => {
  const [colorMode] = useColorMode()
  const [blocked, setBlocked] = useState<BlockedReason | null>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  /** Set by the frame's own load event; read by the refusal backstop. */
  const loadedRef = useRef(false)

  /**
   * The app has a colour scheme of its own, and a framed page that follows the
   * operating system's instead puts a light page in a dark shell.
   *
   * The frame is same-origin, so its document is readable and its storage is
   * shared. A deployment that serves the page from elsewhere gives neither, and
   * is left as the server sent it rather than raising.
   */
  const applyColorMode = useCallback(() => {
    if (themeSync === 'none') return

    const frame = frameRef.current
    const doc = frame?.contentDocument

    if (!doc) return

    if (themeSync === 'swagger-ui') {
      doc.documentElement.classList.toggle('dark-mode', colorMode === 'dark')

      return
    }

    const palette = {
      index: colorMode === 'dark' ? 1 : 0,
      color: {
        scheme: colorMode === 'dark' ? 'slate' : 'default',
        primary: colorMode === 'dark' ? 'black' : 'white',
        accent: 'amber'
      }
    }

    try {
      frame?.contentWindow?.localStorage.setItem(
        '__palette',
        JSON.stringify(palette)
      )
    } catch (error) {
      // storage can be refused; the attributes below still switch this page
    }

    doc.body?.setAttribute('data-md-color-scheme', palette.color.scheme)
    doc.body?.setAttribute('data-md-color-primary', palette.color.primary)
    doc.body?.setAttribute('data-md-color-accent', palette.color.accent)

    // The docs' own script decides its first paint from the app's setting, so a
    // scheme switched while the page is open has to be announced.
    frame?.contentWindow?.postMessage(
      { type: 'sasjs-theme', mode: colorMode },
      window.location.origin
    )
  }, [colorMode, themeSync])

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
