import React, { Dispatch, SetStateAction } from 'react'
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

import { PermissionResponse } from '../../utils/types'
import { BootstrapDialogTitle } from '../../components/dialogTitle'
import { PrincipalType } from './permission'

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2)
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1)
  }
}))

type FilterModalProps = {
  open: boolean
  handleOpen: Dispatch<SetStateAction<boolean>>
  permissions: PermissionResponse[]
  uriFilter: string[]
  setUriFilter: Dispatch<SetStateAction<string[]>>
  principalFilter: string[]
  setPrincipalFilter: Dispatch<SetStateAction<string[]>>
  principalTypeFilter: PrincipalType[]
  setPrincipalTypeFilter: Dispatch<SetStateAction<PrincipalType[]>>
  settingFilter: string[]
  setSettingFilter: Dispatch<SetStateAction<string[]>>
  applyFilter: () => void
  resetFilter: () => void
}

const PermissionFilterModal = ({
  open,
  handleOpen,
  permissions,
  uriFilter,
  setUriFilter,
  principalFilter,
  setPrincipalFilter,
  principalTypeFilter,
  setPrincipalTypeFilter,
  settingFilter,
  setSettingFilter,
  applyFilter,
  resetFilter
}: FilterModalProps) => {
  const URIs = permissions
    .map((permission) => permission.uri)
    .filter((uri, index, array) => array.indexOf(uri) === index)

  // fetch all the principals from permissions array
  let principals = permissions.map((permission) => {
    if (permission.user) return permission.user.username
    if (permission.group) return permission.group.name
    return ''
  })

  // removes empty strings
  principals = principals.filter((principal) => principal !== '')

  // removes the duplicates
  principals = principals.filter(
    (principal, index, array) => array.indexOf(principal) === index
  )

  return (
    <BootstrapDialog onClose={() => handleOpen(false)} open={open}>
      <BootstrapDialogTitle
        id="permission-filter-dialog-title"
        handleOpen={handleOpen}
      >
        Permission Filter
      </BootstrapDialogTitle>
      <DialogContent dividers>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={URIs}
              filterSelectedOptions
              value={uriFilter}
              onChange={(event: any, newValue: string[]) => {
                setUriFilter(newValue)
              }}
              renderInput={(params) => <TextField {...params} label="URIs" />}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={principals}
              filterSelectedOptions
              value={principalFilter}
              onChange={(event: any, newValue: string[]) => {
                setPrincipalFilter(newValue)
              }}
              renderInput={(params) => (
                <TextField {...params} label="Principals" />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={Object.values(PrincipalType)}
              filterSelectedOptions
              value={principalTypeFilter}
              onChange={(event: any, newValue: PrincipalType[]) => {
                setPrincipalTypeFilter(newValue)
              }}
              renderInput={(params) => (
                <TextField {...params} label="Principal Type" />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={['Grant', 'Deny']}
              filterSelectedOptions
              value={settingFilter}
              onChange={(event: any, newValue: string[]) => {
                setSettingFilter(newValue)
              }}
              renderInput={(params) => (
                <TextField {...params} label="Settings" />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="error" onClick={resetFilter}>
          Reset
        </Button>
        <Button variant="outlined" onClick={applyFilter}>
          Apply
        </Button>
      </DialogActions>
    </BootstrapDialog>
  )
}

export default PermissionFilterModal
