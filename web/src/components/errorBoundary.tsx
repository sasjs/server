import React, { ErrorInfo, ReactNode } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

/**
 * Catches a route that fails to render, so a lazily loaded chunk that cannot be
 * fetched shows a message and a way out instead of a blank page.
 *
 * The failure this exists for is ordinary: a deploy replaces the hashed asset
 * while a tab is open, or the user is offline when they first open Studio.
 * React throws during render when the dynamic import rejects, and with no
 * boundary that unmounts the whole route - which looks like the application
 * having lost its mind rather than a download having failed.
 *
 * The retry reloads rather than resetting state alone: the chunk has to be
 * fetched again, and a reload is the one thing guaranteed to ask the server for
 * the current hashed file.
 */
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.log(error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          height: '100%',
          minHeight: 240,
          p: 4,
          textAlign: 'center'
        }}
      >
        <Typography variant="h6">This screen could not be loaded</Typography>
        <Typography variant="body2" color="text.secondary">
          It may have been replaced by a newer version of the application, or
          the connection may have dropped.
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </Box>
    )
  }
}

export default ErrorBoundary
