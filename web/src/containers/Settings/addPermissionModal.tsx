import React, {
  useState,
  useEffect,
  useMemo,
  Dispatch,
  SetStateAction
} from 'react'
import axios from 'axios'
import {
  Button,
  Grid,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress
} from '@mui/material'
import { styled } from '@mui/material/styles'
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete'

import { BootstrapDialogTitle } from '../../components/dialogTitle'

import {
  PermissionResponse,
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
  permissions: PermissionResponse[]
  addPermission: (addPermissionPayload: RegisterPermissionPayload) => void
}

const filter = createFilterOptions<string>()

const AddPermissionModal = ({
  open,
  handleOpen,
  permissions,
  addPermission
}: AddPermissionModalProps) => {
  const [uri, setUri] = useState<string>()
  const [principalType, setPrincipalType] = useState('user')
  const [userPrincipal, setUserPrincipal] = useState<UserResponse>()
  const [groupPrincipal, setGroupPrincipal] = useState<GroupResponse>()
  const [permissionSetting, setPermissionSetting] = useState('Grant')
  const [loadingPrincipals, setLoadingPrincipals] = useState(false)
  const [userPrincipals, setUserPrincipals] = useState<UserResponse[]>([])
  const [groupPrincipals, setGroupPrincipals] = useState<GroupResponse[]>([])

  useEffect(() => {
    setLoadingPrincipals(true)
    axios
      .get(`/SASjsApi/${principalType}`)
      .then((res: any) => {
        if (res.data) {
          if (principalType === 'user') setUserPrincipals(res.data)
          else setGroupPrincipals(res.data)
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
      uri,
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

  const URIs = useMemo(() => {
    return permissions
      .map((permission) => permission.uri)
      .filter((uri, index, array) => array.indexOf(uri) === index)
  }, [permissions])

  const addButtonDisabled =
    !uri || (principalType === 'user' ? !userPrincipal : !groupPrincipal)

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
              disableClearable
              value={uri}
              onChange={(event, newValue) => setUri(newValue)}
              filterOptions={(options, params) => {
                const filtered = filter(options, params)

                const { inputValue } = params

                const isExisting = options.some(
                  (option) => inputValue === option
                )
                if (inputValue !== '' && !isExisting) {
                  filtered.push(inputValue)
                }
                return filtered
              }}
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
              options={URIs}
              renderOption={(props, option) => <li {...props}>{option}</li>}
              freeSolo
              renderInput={(params) => <TextField {...params} label="URI" />}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              options={['user', 'group']}
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
