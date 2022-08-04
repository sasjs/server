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
  addPermission: (
    permissions: RegisterPermissionPayload[],
    permissionType: string,
    principalType: string,
    principal: string,
    permissionSetting: string
  ) => void
}

const AddPermissionModal = ({
  open,
  handleOpen,
  addPermission
}: AddPermissionModalProps) => {
  const [paths, setPaths] = useState<string[]>([])
  const [loadingPaths, setLoadingPaths] = useState(false)
  const [selectedPaths, setSelectedPaths] = useState<string[]>([])
  const [permissionType, setPermissionType] = useState('Route')
  const [principalType, setPrincipalType] = useState('Group')
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
      .get(`/SASjsApi/${principalType.toLowerCase()}`)
      .then((res: any) => {
        if (res.data) {
          if (principalType.toLowerCase() === 'user') {
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
    const permissions: RegisterPermissionPayload[] = []

    selectedPaths.forEach((path) => {
      const addPermissionPayload: any = {
        path,
        type: permissionType,
        setting: permissionSetting,
        principalType: principalType.toLowerCase(),
        principalId:
          principalType.toLowerCase() === 'user'
            ? userPrincipal?.id
            : groupPrincipal?.groupId
      }

      permissions.push(addPermissionPayload)
    })

    const principal =
      principalType.toLowerCase() === 'user'
        ? userPrincipal?.username
        : groupPrincipal?.name

    addPermission(
      permissions,
      permissionType,
      principalType,
      principal!,
      permissionSetting
    )
  }

  const addButtonDisabled =
    !selectedPaths.length ||
    (principalType.toLowerCase() === 'user' ? !userPrincipal : !groupPrincipal)

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
              multiple
              options={paths}
              filterSelectedOptions
              value={selectedPaths}
              onChange={(event: any, newValue: string[]) => {
                setSelectedPaths(newValue)
              }}
              renderInput={(params) => <TextField {...params} label="Paths" />}
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
              options={['Group', 'User']}
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
            {principalType.toLowerCase() === 'user' ? (
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
