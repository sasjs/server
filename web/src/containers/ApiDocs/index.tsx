import { useCallback, useEffect, useRef } from 'react'
import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import { OpenInNew } from '@mui/icons-material'

import { apiBaseUrl } from '../../utils'
import { useColorMode } from '../../utils/hooks'

/** The header's dense toolbar, which this pane sits below. */
const HEADER_HEIGHT = 48
const TITLE_BAR_HEIGHT = 40

/**
 * The REST API's documentation, inside the app.
 *
 * Swagger UI at /SASjsApi is a static page served by the API - it carries its
 * own stylesheet and its own scripts - so the app shows it in a frame instead of
 * re-rendering it. A frame keeps the header and tabs in place, which is what
 * makes following a link to the API stay in the application, and Back returns to
 * the previous screen the way it does anywhere else.
 *
 * The frame is same-origin, which the default Content-Security-Policy
 * (`default-src 'self'`) and `frame-ancestors 'self'` both allow, so no policy
 * change is needed to host it.
 */
const ApiDocs = () => {
  const src = `${apiBaseUrl}/SASjsApi`
  const [colorMode] = useColorMode()
  const frameRef = useRef<HTMLIFrameElement>(null)

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

  useEffect(applyColorMode, [applyColorMode])

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
      <Box
        component="iframe"
        title="SASjs Server API documentation"
        src={src}
        ref={frameRef}
        onLoad={applyColorMode}
        sx={{ flexGrow: 1, width: '100%', border: 0, display: 'block' }}
      />
    </Box>
  )
}

export default ApiDocs
