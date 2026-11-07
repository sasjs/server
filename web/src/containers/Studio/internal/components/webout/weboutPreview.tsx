import { useState } from 'react'
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { isHtmlOutput } from '../../../../../utils'

interface WebOutPreviewProps {
  /** What the program wrote to the `_webout` fileref. */
  output: string
}

/**
 * The `webout` tab: the run's output as a page, with the source a click away.
 *
 * The page is rendered in an iframe with an empty `sandbox`, so the output is
 * displayed but nothing in it runs: no scripts, no forms, no navigation of the
 * Studio, and no access to the parent document. Images still load - a `data:`
 * URI, or a path the program wrote to Drive - because loading an image needs no
 * origin of its own.
 *
 * A webout that is not a page (JSON from `%webout()`, a printed line) stays text:
 * an iframe would collapse its whitespace and lose exactly what makes it useful.
 */
const WebOutPreview = (props: WebOutPreviewProps) => {
  const { output } = props
  const isPage = isHtmlOutput(output)
  const [showSource, setShowSource] = useState(false)

  const source = (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 1,
        height: 'calc(100vh - 250px)',
        overflow: 'auto',
        bgcolor: 'background.default',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        fontSize: 13
      }}
    >
      {output}
    </Box>
  )

  if (!isPage) return source

  return (
    <Box>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={showSource ? 'source' : 'preview'}
        onChange={(_, value: string | null) => {
          if (value) setShowSource(value === 'source')
        }}
        sx={{ mb: 1 }}
      >
        <ToggleButton value="preview">Preview</ToggleButton>
        <ToggleButton value="source">Source</ToggleButton>
      </ToggleButtonGroup>
      {showSource ? (
        source
      ) : (
        <Box
          component="iframe"
          title="webout preview"
          sandbox=""
          srcDoc={output}
          sx={{
            width: '100%',
            height: 'calc(100vh - 290px)',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.paper'
          }}
        />
      )}
    </Box>
  )
}

export default WebOutPreview
