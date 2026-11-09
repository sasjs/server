import { useEffect, useState } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { OpenInNew } from '@mui/icons-material'

import FramedPane from '../../components/framedPane'

/** Where the server mounts the built documentation. */
const src = '/docs/'

/** The published pages, for a build that carries no copy of its own. */
const publicSite = 'https://server.sasjs.io/docs/'

/**
 * The server's own documentation, inside the app.
 *
 * The site is built from `docs/` at build time and copied into the web build,
 * so the copy a reader sees describes the build that carries it - a page and the
 * screen it documents are never a release apart. A development build that did
 * not run the docs step has no copy, which is why the pane asks before drawing
 * a frame: a 404 framed without explanation reads as a broken screen rather than
 * as a build without docs.
 */
const Docs = () => {
  const [present, setPresent] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true

    fetch(src, { method: 'HEAD' })
      .then((response) => {
        if (active) setPresent(response.ok)
      })
      .catch(() => {
        if (active) setPresent(false)
      })

    return () => {
      active = false
    }
  }, [])

  if (present === false)
    return (
      <Box sx={{ p: 4, maxWidth: 640 }}>
        <Typography variant="subtitle1" gutterBottom>
          This build carries no documentation
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          The pages are built from <code>docs/</code> and copied into the web
          build, and this build skipped that step - a development checkout
          unless <code>npm run docs:build</code> has been run. The published
          site carries the same pages.
        </Typography>
        <Button
          variant="outlined"
          size="small"
          href={publicSite}
          target="_blank"
          rel="noreferrer"
          startIcon={<OpenInNew />}
          sx={{ mt: 1 }}
        >
          Open {publicSite.replace('https://', '')}
        </Button>
      </Box>
    )

  // A null state is the moment before the HEAD answer: drawing the frame first
  // would flash a 404 into the pane on a build without docs.
  if (present === null) return null

  return (
    <FramedPane
      src={src}
      title="SASjs Server documentation"
      themeSync="material"
      openLabel="Open the documentation"
      blockedHeading="The documentation cannot be shown here"
      refusalHelp={
        <>
          This server's Content-Security-Policy refuses to frame its own
          documentation site, so the screen has nothing to draw. The pages are
          served normally - they open in a new tab - and an administrator can
          allow them by adding
          <code> frame-src 'self' </code>
          to the policy, or by removing HELMET_CSP_CONFIG_PATH so the server's
          own defaults apply.
        </>
      }
      unavailableHelp={
        <>
          The documentation did not load in time. The policy allows this frame,
          so the cause is elsewhere: a slow first request, a proxy in front of
          the server, or a header of its own that refuses framing. The pages
          still open in a new tab.
        </>
      }
    />
  )
}

export default Docs
