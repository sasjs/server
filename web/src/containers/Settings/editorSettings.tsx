import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Typography
} from '@mui/material'

import { useSetting } from '../../utils/hooks'

/**
 * The editor section of Settings. Every entry reads from and writes to the
 * Studio settings store, so the values here are the ones the editor actions
 * consult at the moment they run.
 */
const EditorSettings = () => {
  // Both settings are read through the store, so a change made by the log tab's
  // eye is reflected on this panel's switch without a reload.
  const [formatOnSave, setFormatOnSave] = useSetting('editor.formatOnSave')
  const [listedNotes, setListedNotes] = useSetting('log.notableNotes')
  // The header's sun/moon button only ever writes `light` or `dark`, so this is
  // the way back to following the desktop.
  const [colorTheme, setColorTheme] = useSetting('workbench.colorTheme')

  return (
    <Card>
      <CardHeader title="Editor" />
      <Divider />
      <CardContent>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={formatOnSave}
                onChange={(event) => setFormatOnSave(event.target.checked)}
              />
            }
            label="Format On Save"
          />
          <Typography variant="caption" sx={{ marginLeft: 4 }}>
            Apply SASjs lint formatting to SAS files when saving in Studio
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={listedNotes}
                onChange={(event) => setListedNotes(event.target.checked)}
              />
            }
            label="List notable log notes"
          />
          <Typography variant="caption" sx={{ marginLeft: 4 }}>
            List the notable NOTE: lines of a SAS log beside its errors and
            warnings - an uninitialized variable, invalid data, a format too
            small for its value. Ordinary notes are never listed.
          </Typography>
        </FormGroup>
      </CardContent>
      <Divider />
      <CardHeader title="Appearance" />
      <CardContent>
        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel id="color-theme-label">Colour theme</InputLabel>
          <Select
            labelId="color-theme-label"
            label="Colour theme"
            value={colorTheme}
            onChange={(event) =>
              setColorTheme(event.target.value as 'system' | 'light' | 'dark')
            }
          >
            <MenuItem value="system">Follow the desktop</MenuItem>
            <MenuItem value="light">Light</MenuItem>
            <MenuItem value="dark">Dark</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
          The sun or moon in the header switches between light and dark at any
          time; this keeps the choice, or hands it back to the desktop.
        </Typography>
      </CardContent>
    </Card>
  )
}

export default EditorSettings
