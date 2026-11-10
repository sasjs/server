import { useRef, useState } from 'react'
import { Alert, Box, Button, Typography } from '@mui/material'
import axios from 'axios'

import { deployFormFor } from './deployForm'

interface PublishedApp {
  id: string
  name: string
  url: string
}

interface PublishResult {
  message: string
  /** The app this deploy published, when it published one. */
  app?: PublishedApp
}

/**
 * Publishes a build: picks a `build.json`, posts it to the deploy endpoint, and
 * names the streamed app that results.
 *
 * This is the "Upload New App" tile from the App Stream page, moved into
 * Administration. That page stays as the path apps are served from, but it is no
 * longer somewhere users are sent to browse - the home screen lists the apps,
 * filtered to the caller's grants - so the one management action it carried
 * lives here, behind the admin-only screen.
 */
const PublishApp = () => {
  const input = useRef<HTMLInputElement>(null)
  const [publishing, setPublishing] = useState(false)
  const [result, setResult] = useState<PublishResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const publish = async (file: File) => {
    setPublishing(true)
    setResult(null)
    setError(null)

    try {
      const { data } = await axios.post<PublishResult>(
        '/SASjsApi/drive/deploy/upload',
        deployFormFor(file)
      )

      setResult(data)
    } catch (err: any) {
      setError(
        typeof err.response?.data === 'string'
          ? err.response.data
          : 'The build could not be published.'
      )
    } finally {
      setPublishing(false)
      // Allow the same file to be chosen again after a failure.
      if (input.current) input.current.value = ''
    }
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Choose a <code>build.json</code> or a zip from a compiled SASjs app. The
        app is deployed to the drive and streamed at{' '}
        <code>/app/&lt;id&gt;/</code>, where the id is assigned on the first
        publish and kept on every redeploy - so the URL survives a new bundle.
      </Typography>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        hidden
        data-testid="publish-app-input"
        onChange={(event) => {
          const file = event.target.files?.[0]

          if (file) publish(file)
        }}
      />
      <Button
        variant="contained"
        disabled={publishing}
        onClick={() => input.current?.click()}
      >
        {publishing ? 'Publishing...' : 'Upload build.json'}
      </Button>
      {result && (
        <Alert severity="success" sx={{ mt: 1 }}>
          {result.message}{' '}
          {result.app ? (
            <>
              Published as <strong>{result.app.name}</strong>, at{' '}
              <a href={result.app.url} target="_blank" rel="noreferrer">
                {result.app.url}
              </a>
              .
            </>
          ) : (
            'No app was published: the archive carries no web folder, so it was deployed as files only.'
          )}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  )
}

export default PublishApp
