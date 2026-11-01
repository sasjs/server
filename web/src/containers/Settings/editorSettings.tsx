import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControlLabel,
  FormGroup,
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
    </Card>
  )
}

export default EditorSettings
