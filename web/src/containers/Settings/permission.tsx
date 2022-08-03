import React, { useState, useEffect, useContext, useCallback } from 'react'
import axios from 'axios'
import {
  Box,
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
  Tooltip,
  Typography,
  Popover
} from '@mui/material'

import FilterListIcon from '@mui/icons-material/FilterList'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'

import { styled } from '@mui/material/styles'

import Modal from '../../components/modal'
import PermissionFilterModal from './permissionFilterModal'
import AddPermissionModal from './addPermissionModal'
import PermissionResponseModal from './addPermissionResponseModal'
import UpdatePermissionModal from './updatePermissionModal'
import DeleteConfirmationModal from '../../components/deleteConfirmationModal'
import BootstrapSnackbar, { AlertSeverityType } from '../../components/snackbar'

import {
  GroupDetailsResponse,
  PermissionResponse,
  RegisterPermissionPayload
} from '../../utils/types'
import { AppContext } from '../../context/appContext'

const BootstrapTableCell = styled(TableCell)({
  textAlign: 'left'
})

export enum PrincipalType {
  User = 'User',
  Group = 'Group'
}

const Permission = () => {
  const appContext = useContext(AppContext)
  const [isLoading, setIsLoading] = useState(false)
  const [openModal, setOpenModal] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalPayload, setModalPayload] = useState('')
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertSeverityType>(
    AlertSeverityType.Success
  )
  const [addPermissionModalOpen, setAddPermissionModalOpen] = useState(false)
  const [openPermissionResponseModal, setOpenPermissionResponseModal] =
    useState(false)
  const [addedPermissions, setAddedPermission] = useState<PermissionResponse[]>(
    []
  )
  const [errorResponses, setErrorResponses] = useState<any[]>([])

  const [updatePermissionModalOpen, setUpdatePermissionModalOpen] =
    useState(false)
  const [deleteConfirmationModalOpen, setDeleteConfirmationModalOpen] =
    useState(false)
  const [deleteConfirmationModalMessage, setDeleteConfirmationModalMessage] =
    useState('')
  const [selectedPermission, setSelectedPermission] =
    useState<PermissionResponse>()
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [pathFilter, setPathFilter] = useState<string[]>([])
  const [principalFilter, setPrincipalFilter] = useState<string[]>([])
  const [principalTypeFilter, setPrincipalTypeFilter] = useState<
    PrincipalType[]
  >([])
  const [settingFilter, setSettingFilter] = useState<string[]>([])
  const [permissions, setPermissions] = useState<PermissionResponse[]>([])
  const [filteredPermissions, setFilteredPermissions] = useState<
    PermissionResponse[]
  >([])
  const [filterApplied, setFilterApplied] = useState(false)

  const fetchPermissions = useCallback(() => {
    axios
      .get(`/SASjsApi/permission`)
      .then((res: any) => {
        if (res.data?.length > 0) {
          setPermissions(res.data)
        }
      })
      .catch((err) => {
        setModalTitle('Abort')
        setModalPayload(
          typeof err.response.data === 'object'
            ? JSON.stringify(err.response.data)
            : err.response.data
        )
        setOpenModal(true)
      })
  }, [])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  /**
   * first find the permissions w.r.t each filter type
   * take intersection of resultant arrays
   */
  const applyFilter = () => {
    setFilterModalOpen(false)

    const uriFilteredPermissions =
      pathFilter.length > 0
        ? permissions.filter((permission) =>
            pathFilter.includes(permission.path)
          )
        : permissions

    const principalFilteredPermissions =
      principalFilter.length > 0
        ? permissions.filter((permission) => {
            if (permission.user) {
              return principalFilter.includes(permission.user.username)
            }
            if (permission.group) {
              return principalFilter.includes(permission.group.name)
            }
            return false
          })
        : permissions

    const principalTypeFilteredPermissions =
      principalTypeFilter.length > 0
        ? permissions.filter((permission) => {
            if (permission.user) {
              return principalTypeFilter.includes(PrincipalType.User)
            }
            if (permission.group) {
              return principalTypeFilter.includes(PrincipalType.Group)
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
      principalTypeFilteredPermissions.some(
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
    setFilterModalOpen(false)
    setPathFilter([])
    setPrincipalFilter([])
    setSettingFilter([])
    setFilteredPermissions([])
    setFilterApplied(false)
  }

  const addPermission = (permissions: RegisterPermissionPayload[]) => {
    setAddPermissionModalOpen(false)
    setAddedPermission([])
    setErrorResponses([])
    setIsLoading(true)

    const permissionResponses: PermissionResponse[] = []
    const errors: any = []

    permissions.forEach(async (permission) => {
      await axios
        .post('/SASjsApi/permission', permission)
        .then((res) => {
          permissionResponses.push(res.data)
        })
        .catch((error) => {
          errors.push({ error, permission })
        })
    })

    fetchPermissions()
    setIsLoading(false)
    setOpenPermissionResponseModal(true)
    setAddedPermission(permissionResponses)
    setErrorResponses(errors)
  }

  const handleUpdatePermissionClick = (permission: PermissionResponse) => {
    setSelectedPermission(permission)
    setUpdatePermissionModalOpen(true)
  }

  const updatePermission = (setting: string) => {
    setUpdatePermissionModalOpen(false)
    setIsLoading(true)
    axios
      .patch(`/SASjsApi/permission/${selectedPermission?.permissionId}`, {
        setting
      })
      .then((res: any) => {
        fetchPermissions()
        setSnackbarMessage('Permission updated!')
        setSnackbarSeverity(AlertSeverityType.Success)
        setOpenSnackbar(true)
      })
      .catch((err) => {
        setModalTitle('Abort')
        setModalPayload(
          typeof err.response.data === 'object'
            ? JSON.stringify(err.response.data)
            : err.response.data
        )
        setOpenModal(true)
      })
      .finally(() => {
        setIsLoading(false)
        setSelectedPermission(undefined)
      })
  }

  const handleDeletePermissionClick = (permission: PermissionResponse) => {
    setSelectedPermission(permission)
    setDeleteConfirmationModalOpen(true)
    setDeleteConfirmationModalMessage(
      'Are you sure you want to delete this permission?'
    )
  }

  const deletePermission = () => {
    setDeleteConfirmationModalOpen(false)
    setIsLoading(true)
    axios
      .delete(`/SASjsApi/permission/${selectedPermission?.permissionId}`)
      .then((res: any) => {
        fetchPermissions()
        setSnackbarMessage('Permission deleted!')
        setSnackbarSeverity(AlertSeverityType.Success)
        setOpenSnackbar(true)
      })
      .catch((err) => {
        setModalTitle('Abort')
        setModalPayload(
          typeof err.response.data === 'object'
            ? JSON.stringify(err.response.data)
            : err.response.data
        )
        setOpenModal(true)
      })
      .finally(() => {
        setIsLoading(false)
        setSelectedPermission(undefined)
      })
  }

  return isLoading ? (
    <CircularProgress
      style={{ position: 'absolute', left: '50%', top: '50%' }}
    />
  ) : (
    <Box className="permissions-page">
      <Grid container direction="column" spacing={1}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ display: 'flex' }}>
            <Tooltip title="Filter Permissions">
              <IconButton>
                <FilterListIcon onClick={() => setFilterModalOpen(true)} />
              </IconButton>
            </Tooltip>
            {appContext.isAdmin && (
              <Tooltip
                sx={{ marginLeft: 'auto' }}
                title="Add Permission"
                placement="bottom-end"
              >
                <IconButton onClick={() => setAddPermissionModalOpen(true)}>
                  <AddIcon />
                </IconButton>
              </Tooltip>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <PermissionTable
            permissions={filterApplied ? filteredPermissions : permissions}
            handleUpdatePermissionClick={handleUpdatePermissionClick}
            handleDeletePermissionClick={handleDeletePermissionClick}
          />
        </Grid>
      </Grid>
      <BootstrapSnackbar
        open={openSnackbar}
        setOpen={setOpenSnackbar}
        message={snackbarMessage}
        severity={snackbarSeverity}
      />
      <Modal
        open={openModal}
        setOpen={setOpenModal}
        title={modalTitle}
        payload={modalPayload}
      />
      <PermissionFilterModal
        open={filterModalOpen}
        handleOpen={setFilterModalOpen}
        permissions={permissions}
        pathFilter={pathFilter}
        setPathFilter={setPathFilter}
        principalFilter={principalFilter}
        setPrincipalFilter={setPrincipalFilter}
        principalTypeFilter={principalTypeFilter}
        setPrincipalTypeFilter={setPrincipalTypeFilter}
        settingFilter={settingFilter}
        setSettingFilter={setSettingFilter}
        applyFilter={applyFilter}
        resetFilter={resetFilter}
      />
      <AddPermissionModal
        open={addPermissionModalOpen}
        handleOpen={setAddPermissionModalOpen}
        addPermission={addPermission}
      />
      <PermissionResponseModal
        open={openPermissionResponseModal}
        setOpen={setOpenPermissionResponseModal}
        permissionResponses={addedPermissions}
        errorResponses={errorResponses}
      />
      <UpdatePermissionModal
        open={updatePermissionModalOpen}
        handleOpen={setUpdatePermissionModalOpen}
        permission={selectedPermission}
        updatePermission={updatePermission}
      />
      <DeleteConfirmationModal
        open={deleteConfirmationModalOpen}
        setOpen={setDeleteConfirmationModalOpen}
        message={deleteConfirmationModalMessage}
        _delete={deletePermission}
      />
    </Box>
  )
}

export default Permission

type PermissionTableProps = {
  permissions: PermissionResponse[]
  handleUpdatePermissionClick: (permission: PermissionResponse) => void
  handleDeletePermissionClick: (permission: PermissionResponse) => void
}

const PermissionTable = ({
  permissions,
  handleUpdatePermissionClick,
  handleDeletePermissionClick
}: PermissionTableProps) => {
  const appContext = useContext(AppContext)

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead sx={{ background: 'rgb(0,0,0, 0.3)' }}>
          <TableRow>
            <BootstrapTableCell>Path</BootstrapTableCell>
            <BootstrapTableCell>Permission Type</BootstrapTableCell>
            <BootstrapTableCell>Principal</BootstrapTableCell>
            <BootstrapTableCell>Principal Type</BootstrapTableCell>
            <BootstrapTableCell>Setting</BootstrapTableCell>
            {appContext.isAdmin && (
              <BootstrapTableCell>Action</BootstrapTableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {permissions.map((permission) => (
            <TableRow key={permission.permissionId}>
              <BootstrapTableCell>{permission.path}</BootstrapTableCell>
              <BootstrapTableCell>{permission.type}</BootstrapTableCell>
              <BootstrapTableCell>
                {displayPrincipal(permission)}
              </BootstrapTableCell>
              <BootstrapTableCell>
                {displayPrincipalType(permission)}
              </BootstrapTableCell>
              <BootstrapTableCell>{permission.setting}</BootstrapTableCell>
              {appContext.isAdmin && (
                <BootstrapTableCell>
                  <Tooltip title="Edit Permission">
                    <IconButton
                      onClick={() => handleUpdatePermissionClick(permission)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Permission">
                    <IconButton
                      color="error"
                      onClick={() => handleDeletePermissionClick(permission)}
                    >
                      <DeleteForeverIcon />
                    </IconButton>
                  </Tooltip>
                </BootstrapTableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

const displayPrincipal = (permission: PermissionResponse) => {
  if (permission.user) return permission.user.username
  if (permission.group) return <DisplayGroup group={permission.group} />
}

type DisplayGroupProps = {
  group: GroupDetailsResponse
}

const DisplayGroup = ({ group }: DisplayGroupProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handlePopoverClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)

  return (
    <div>
      <Typography
        aria-owns={open ? 'mouse-over-popover' : undefined}
        aria-haspopup="true"
        onMouseEnter={handlePopoverOpen}
        onMouseLeave={handlePopoverClose}
      >
        {group.name}
      </Typography>
      <Popover
        id="mouse-over-popover"
        sx={{
          pointerEvents: 'none'
        }}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        onClose={handlePopoverClose}
        disableRestoreFocus
      >
        <Typography sx={{ p: 1 }} variant="h6" component="div">
          Group Members
        </Typography>
        {group.users.map((user) => (
          <Typography sx={{ p: 1 }} component="li">
            {user.username}
          </Typography>
        ))}
      </Popover>
    </div>
  )
}

const displayPrincipalType = (permission: PermissionResponse) => {
  if (permission.user) return PrincipalType.User
  if (permission.group) return PrincipalType.Group
}
