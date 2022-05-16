import React, { useState, useEffect, Dispatch, SetStateAction } from 'react'
import axios from 'axios'
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  CircularProgress,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'

import FilterListIcon from '@mui/icons-material/FilterList'

import { styled } from '@mui/material/styles'

import { BootstrapDialogTitle } from '../../components/dialogTitle'

interface UserResponse {
  id: number
  username: string
  displayName: string
}

interface GroupResponse {
  groupId: number
  name: string
  description: string
}

interface PermissionResponse {
  permissionId: number
  uri: string
  setting: string
  user?: UserResponse
  group?: GroupResponse
}

const BootstrapTableCell = styled(TableCell)({
  textAlign: 'left'
})

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2)
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1)
  }
}))

const Permission = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [uriFilter, setUriFilter] = useState<string[]>([])
  const [principalFilter, setPrincipalFilter] = useState<string[]>([])
  const [settingFilter, setSettingFilter] = useState<string[]>([])
  const [permissions, setPermissions] = useState<PermissionResponse[]>([])
  const [filteredPermissions, setFilteredPermissions] = useState<
    PermissionResponse[]
  >([])
  const [filterApplied, setFilterApplied] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    axios
      .get(`/SASjsApi/permission`)
      .then((res: any) => {
        if (res.data?.length > 0) {
          setPermissions(res.data)
        }
      })
      .catch((err) => {
        console.log(err)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  /**
   * first find the permissions w.r.t each filter type
   * take intersection of resultant arrays
   */
  const applyFilter = () => {
    const uriFilteredPermissions =
      uriFilter.length > 0
        ? permissions.filter((permission) => uriFilter.includes(permission.uri))
        : permissions
    const principalFilteredPermissions =
      principalFilter.length > 0
        ? permissions.filter((permission) => {
            if (permission.user) {
              return principalFilter.includes(permission.user.displayName)
            } else if (permission.group) {
              return principalFilter.includes(permission.group.name)
            }
            return false
          })
        : permissions
    const settingFilteredPermissions =
      settingFilter.length > 0
        ? permissions.filter((permission) =>
            settingFilter.includes(permission.setting)
          )
        : permissions

    let filteredArray = uriFilteredPermissions.filter((permission) =>
      principalFilteredPermissions.some(
        (item) => item.permissionId === permission.permissionId
      )
    )

    filteredArray = filteredArray.filter((permission) =>
      settingFilteredPermissions.some(
        (item) => item.permissionId === permission.permissionId
      )
    )

    setFilteredPermissions(filteredArray)
    setFilterApplied(true)
  }

  const resetFilter = () => {
    setUriFilter([])
    setPrincipalFilter([])
    setSettingFilter([])
    setFilteredPermissions([])
    setFilterApplied(false)
  }

  return isLoading ? (
    <CircularProgress
      style={{ position: 'absolute', left: '50%', top: '50%' }}
    />
  ) : (
    <Box className="permissions-page">
      <Grid container direction="column" spacing={1}>
        <Grid item xs={12}>
          <Paper elevation={3}>
            <IconButton>
              <FilterListIcon onClick={() => setFilterModalOpen(true)} />
            </IconButton>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <PermissionTable
            permissions={filterApplied ? filteredPermissions : permissions}
          />
        </Grid>
      </Grid>
      <FilterModal
        open={filterModalOpen}
        handleClose={setFilterModalOpen}
        permissions={permissions}
        uriFilter={uriFilter}
        setUriFilter={setUriFilter}
        principalFilter={principalFilter}
        setPrincipalFilter={setPrincipalFilter}
        settingFilter={settingFilter}
        setSettingFilter={setSettingFilter}
        applyFilter={applyFilter}
        resetFilter={resetFilter}
      />
    </Box>
  )
}

export default Permission

type PermissionTableProps = {
  permissions: PermissionResponse[]
}

const PermissionTable = ({ permissions }: PermissionTableProps) => {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead sx={{ background: 'rgb(0,0,0, 0.3)' }}>
          <TableRow>
            <BootstrapTableCell>Uri</BootstrapTableCell>
            <BootstrapTableCell>Principal</BootstrapTableCell>
            <BootstrapTableCell>Setting</BootstrapTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {permissions.map((permission) => (
            <TableRow>
              <BootstrapTableCell>{permission.uri}</BootstrapTableCell>
              <BootstrapTableCell>
                {displayPrincipal(permission)}
              </BootstrapTableCell>
              <BootstrapTableCell>{permission.setting}</BootstrapTableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

const displayPrincipal = (permission: PermissionResponse) => {
  if (permission.user) {
    return permission.user?.displayName
  } else if (permission.group) {
    return permission.group?.name
  }
}

type FilterModalProps = {
  open: boolean
  handleClose: Dispatch<SetStateAction<boolean>>
  permissions: PermissionResponse[]
  uriFilter: string[]
  setUriFilter: Dispatch<SetStateAction<string[]>>
  principalFilter: string[]
  setPrincipalFilter: Dispatch<SetStateAction<string[]>>
  settingFilter: string[]
  setSettingFilter: Dispatch<SetStateAction<string[]>>
  applyFilter: () => void
  resetFilter: () => void
}

const FilterModal = ({
  open,
  handleClose,
  permissions,
  uriFilter,
  setUriFilter,
  principalFilter,
  setPrincipalFilter,
  settingFilter,
  setSettingFilter,
  applyFilter,
  resetFilter
}: FilterModalProps) => {
  const URIs = permissions.map((permission) => permission.uri)
  const principals = permissions
    .map((permission) => {
      if (permission.user) return permission.user.displayName
      if (permission.group) return permission.group.name
      return ''
    })
    .filter((principal) => principal !== '')

  return (
    <BootstrapDialog onClose={handleClose} open={open}>
      <BootstrapDialogTitle
        id="permission-filter-dialog-title"
        onClose={handleClose}
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
