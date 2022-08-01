import React, { useState, useEffect, Dispatch, SetStateAction } from 'react'
import axios from 'axios'
import {
  Button,
  Grid,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Autocomplete
} from '@mui/material'
import { styled } from '@mui/material/styles'

import { BootstrapDialogTitle } from '../../components/dialogTitle'

import {
  UserResponse,
  GroupResponse,
  RegisterPermissionPayload
} from '../../utils/types'

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2)
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1)
  }
}))

type AddPermissionModalProps = {
  open: boolean
  handleOpen: Dispatch<SetStateAction<boolean>>
  addPermission: (addPermissionPayload: RegisterPermissionPayload) => void
}

const AddPermissionModal = ({
  open,
  handleOpen,
  addPermission
}: AddPermissionModalProps) => {
  const [paths, setPaths] = useState<string[]>([])
  const [loadingPaths, setLoadingPaths] = useState(false)
  const [path, setPath] = useState<string>()
  const [permissionType, setPermissionType] = useState('Route')
  const [principalType, setPrincipalType] = useState('group')
  const [userPrincipal, setUserPrincipal] = useState<UserResponse>()
  const [groupPrincipal, setGroupPrincipal] = useState<GroupResponse>()
  const [permissionSetting, setPermissionSetting] = useState('Grant')
  const [loadingPrincipals, setLoadingPrincipals] = useState(false)
  const [userPrincipals, setUserPrincipals] = useState<UserResponse[]>([])
  const [groupPrincipals, setGroupPrincipals] = useState<GroupResponse[]>([])

  useEffect(() => {
    setLoadingPaths(true)
    axios
      .get('/SASjsApi/info/authorizedRoutes')
      .then((res: any) => {
        if (res.data) {
          setPaths(res.data.paths)
        }
      })
      .catch((err) => {
        console.log(err)
      })
      .finally(() => {
        setLoadingPaths(false)
      })
  }, [])

  useEffect(() => {
    setLoadingPrincipals(true)
    axios
      .get(`/SASjsApi/${principalType}`)
      .then((res: any) => {
        if (res.data) {
          if (principalType === 'user') {
            const users: UserResponse[] = res.data
            const nonAdminUsers = users.filter((user) => !user.isAdmin)
            setUserPrincipals(nonAdminUsers)
          } else {
            setGroupPrincipals(res.data)
          }
        }
      })
      .catch((err) => {
        console.log(err)
      })
      .finally(() => {
        setLoadingPrincipals(false)
      })
  }, [principalType])

  const handleAddPermission = () => {
    const addPermissionPayload: any = {
      path,
      type: permissionType,
      setting: permissionSetting,
      principalType
    }
    if (principalType === 'user' && userPrincipal) {
      addPermissionPayload.principalId = userPrincipal.id
    } else if (principalType === 'group' && groupPrincipal) {
      addPermissionPayload.principalId = groupPrincipal.groupId
    }
    addPermission(addPermissionPayload)
  }

  const addButtonDisabled =
    !path || (principalType === 'user' ? !userPrincipal : !groupPrincipal)

  return (
    <BootstrapDialog onClose={() => handleOpen(false)} open={open}>
      <BootstrapDialogTitle
        id="add-permission-dialog-title"
        handleOpen={handleOpen}
      >
        Add Permission
      </BootstrapDialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Autocomplete
              options={paths}
              disableClearable
              value={path}
              onChange={(event: any, newValue: string) => setPath(newValue)}
              renderInput={(params) =>
                loadingPaths ? (
                  <CircularProgress />
                ) : (
                  <TextField {...params} autoFocus label="Path" />
                )
              }
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              options={['Route']}
              disableClearable
              value={permissionType}
              onChange={(event: any, newValue: string) =>
                setPermissionType(newValue)
              }
              renderInput={(params) =>
                loadingPaths ? (
                  <CircularProgress />
                ) : (
                  <TextField {...params} label="Permission Type" />
                )
              }
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              options={['group', 'user']}
              getOptionLabel={(option) => option.toUpperCase()}
              disableClearable
              value={principalType}
              onChange={(event: any, newValue: string) =>
                setPrincipalType(newValue)
              }
              renderInput={(params) => (
                <TextField {...params} label="Principal Type" />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            {principalType === 'user' ? (
              <Autocomplete
                options={userPrincipals}
                getOptionLabel={(option) => option.displayName}
                disableClearable
                value={userPrincipal}
                onChange={(event: any, newValue: UserResponse) =>
                  setUserPrincipal(newValue)
                }
                renderInput={(params) =>
                  loadingPrincipals ? (
                    <CircularProgress />
                  ) : (
                    <TextField {...params} label="Principal" />
                  )
                }
              />
            ) : (
              <Autocomplete
                options={groupPrincipals}
                getOptionLabel={(option) => option.name}
                disableClearable
                value={groupPrincipal}
                onChange={(event: any, newValue: GroupResponse) =>
                  setGroupPrincipal(newValue)
                }
                renderInput={(params) =>
                  loadingPrincipals ? (
                    <CircularProgress />
                  ) : (
                    <TextField {...params} label="Principal" />
                  )
                }
              />
            )}
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
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
          onClick={handleAddPermission}
          disabled={addButtonDisabled}
        >
          Add
        </Button>
      </DialogActions>
    </BootstrapDialog>
  )
}

export default AddPermissionModal
