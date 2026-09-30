import { useState } from 'react'
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

import {
  StudioSettings,
  readSettings,
  writeSetting
} from '../../containers/Studio/internal/settings'

/**
 * The editor section of Settings. Every entry reads from and writes to the
 * Studio settings store, so the values here are the ones the editor actions
 * consult at the moment they run.
 */
const EditorSettings = () => {
  const [settings, setSettings] = useState<StudioSettings>(readSettings)

  const updateSetting = <K extends keyof StudioSettings>(
    key: K,
    value: StudioSettings[K]
  ) => {
    writeSetting(key, value)
    setSettings(readSettings())
  }

  return (
    <Card>
      <CardHeader title="Editor" />
      <Divider />
      <CardContent>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={settings['editor.formatOnSave']}
                onChange={(event) =>
                  updateSetting('editor.formatOnSave', event.target.checked)
                }
              />
            }
            label="Format On Save"
          />
          <Typography variant="caption" sx={{ marginLeft: 4 }}>
            Apply SASjs lint formatting to SAS files when saving in Studio
          </Typography>
        </FormGroup>
      </CardContent>
    </Card>
  )
}

export default EditorSettings
