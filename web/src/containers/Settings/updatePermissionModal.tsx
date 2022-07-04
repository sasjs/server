import React, { useState, Dispatch, SetStateAction, useEffect } from 'react'
import {
  Button,
  Grid,
  Dialog,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material'
import { styled } from '@mui/material/styles'
import Autocomplete from '@mui/material/Autocomplete'

import { BootstrapDialogTitle } from '../../components/dialogTitle'

import { PermissionResponse } from '../../utils/types'

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2)
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1)
  }
}))

type UpdatePermissionModalProps = {
  open: boolean
  handleOpen: Dispatch<SetStateAction<boolean>>
  permission: PermissionResponse | undefined
  updatePermission: (setting: string) => void
}

const UpdatePermissionModal = ({
  open,
  handleOpen,
  permission,
  updatePermission
}: UpdatePermissionModalProps) => {
  const [permissionSetting, setPermissionSetting] = useState('Grant')

  useEffect(() => {
    if (permission) setPermissionSetting(permission.setting)
  }, [permission])

  return (
    <BootstrapDialog onClose={() => handleOpen(false)} open={open}>
      <BootstrapDialogTitle
        id="add-permission-dialog-title"
        handleOpen={handleOpen}
      >
        Update Permission
      </BootstrapDialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Autocomplete
              sx={{ width: 300 }}
              options={['Grant', 'Deny']}
              disableClearable
              value={permissionSetting}
              onChange={(event: any, newValue: string) =>
                setPermissionSetting(newValue)
              }
              renderInput={(params) => (
                <TextField {...params} label="Settings" />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          onClick={() => updatePermission(permissionSetting)}
          disabled={permission?.setting === permissionSetting}
        >
          Update
        </Button>
      </DialogActions>
    </BootstrapDialog>
  )
}

export default UpdatePermissionModal
