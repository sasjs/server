import { useState } from 'react'
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { isHtmlOutput, prettyJsonOutput } from '../../../../../utils'

interface WebOutPreviewProps {
  /** What the program wrote to the `_webout` fileref. */
  output: string
}

/**
 * The scroll pane every text view shares. `withToggle` shortens it by the
 * height of the toggle row, so the pane does not push the page taller than the
 * viewport it is sized against.
 */
const textPane = (withToggle: boolean) => ({
  m: 0,
  p: 1,
  height: `calc(100vh - ${withToggle ? 290 : 250}px)`,
  overflow: 'auto',
  bgcolor: 'background.default',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  fontSize: 13
})

/**
 * The `webout` tab: the run's output as a page, as formatted JSON, or as text.
 *
 * The page is rendered in an iframe with an empty `sandbox`, so the output is
 * displayed but nothing in it runs: no scripts, no forms, no navigation of the
 * Studio, and no access to the parent document. Images still load - a `data:`
 * URI, or a path the program wrote to Drive - because loading an image needs no
 * origin of its own.
 *
 * A webout that is not a page (JSON from `%webout()`, a printed line) stays text:
 * an iframe would collapse its whitespace and lose exactly what makes it useful.
 * A JSON document gets indented, with RAW one click away - the raw text is what
 * the program actually wrote, and re-indenting cannot change a value but does
 * change the bytes a reader might copy.
 */
const WebOutPreview = (props: WebOutPreviewProps) => {
  const { output } = props
  const isPage = isHtmlOutput(output)
  const pretty = isPage ? null : prettyJsonOutput(output)
  const [showSource, setShowSource] = useState(false)

  const hasToggle = isPage || pretty !== null

  const source = (
    <Box component="pre" sx={textPane(hasToggle)}>
      {output}
    </Box>
  )

  if (!hasToggle) return source

  return (
    <Box>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={showSource ? 'raw' : 'formatted'}
        onChange={(_, value: string | null) => {
          if (value) setShowSource(value === 'raw')
        }}
        sx={{ mb: 1 }}
      >
        <ToggleButton value="formatted">
          {isPage ? 'Preview' : 'Formatted'}
        </ToggleButton>
        <ToggleButton value="raw">{isPage ? 'Source' : 'Raw'}</ToggleButton>
      </ToggleButtonGroup>
      {showSource ? (
        source
      ) : isPage ? (
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
      ) : (
        <Box component="pre" sx={textPane(true)}>
          {pretty}
        </Box>
      )}
    </Box>
  )
}

export default WebOutPreview
