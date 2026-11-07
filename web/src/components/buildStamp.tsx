import React, { useContext } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import { AppContext } from '../context/appContext'

/**
 * The build this screen came from, stamped in the bottom corner.
 *
 * Every screen carries it, the login one included: that is the screen a
 * support request starts from, and the version is the first thing anyone asks
 * for. It comes from /SASjsApi/info, which the app already fetches before
 * anyone signs in, so the stamp costs no extra request.
 *
 * Fixed rather than laid out in the flow: the screens size themselves - the
 * Studio is a full-height flex column - and a footer in the flow would change
 * their height. `pointerEvents: none` keeps it from sitting between the
 * pointer and a control, and it renders nothing against a server old enough
 * not to report a version.
 */
const BuildStamp = () => {
  const { version } = useContext(AppContext)

  if (!version) return null

  return (
    <Box
      component="footer"
      sx={{
        position: 'fixed',
        bottom: 2,
        right: 8,
        zIndex: (theme) => theme.zIndex.appBar,
        pointerEvents: 'none'
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {version}
      </Typography>
    </Box>
  )
}

export default BuildStamp
