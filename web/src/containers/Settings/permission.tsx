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
  Tooltip
} from '@mui/material'

import FilterListIcon from '@mui/icons-material/FilterList'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'

import { styled } from '@mui/material/styles'

import Modal from '../../components/modal'
import PermissionFilterModal from './permissionFilterModal'
import AddPermissionModal from './addPermissionModal'
import UpdatePermissionModal from './updatePermissionModal'
import DeleteModal from './deletePermissionModal'

import {
  PermissionResponse,
  RegisterPermissionPayload
} from '../../utils/types'
import { AppContext } from '../../context/appContext'

const BootstrapTableCell = styled(TableCell)({
  textAlign: 'left'
})

enum PrincipalType {
  User = 'User',
  Group = 'Group'
}

const Permission = () => {
  const appContext = useContext(AppContext)
  const [isLoading, setIsLoading] = useState(false)
  const [openModal, setOpenModal] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalPayload, setModalPayload] = useState('')
  const [addPermissionModalOpen, setAddPermissionModalOpen] = useState(false)
  const [updatePermissionModalOpen, setUpdatePermissionModalOpen] =
    useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedPermission, setSelectedPermission] =
    useState<PermissionResponse>()
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [uriFilter, setUriFilter] = useState<string[]>([])
  const [principalFilter, setPrincipalFilter] = useState<string[]>([])
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
        setModalPayload(typeof err === 'object' ? err.toSting() : err)
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

  const addPermission = (addPermissionPayload: RegisterPermissionPayload) => {
    setAddPermissionModalOpen(false)
    setIsLoading(true)
    axios
      .post('/SASjsApi/permission', addPermissionPayload)
      .then((res: any) => {
        fetchPermissions()
        setModalTitle('Success')
        setModalPayload('Permission added Successfully.')
        setOpenModal(true)
      })
      .catch((err) => {
        setModalTitle('Abort')
        setModalPayload(typeof err === 'object' ? err.toSting() : err)
        setOpenModal(true)
      })
      .finally(() => {
        setIsLoading(false)
      })
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
        setModalTitle('Success')
        setModalPayload('Permission updated Successfully.')
        setOpenModal(true)
      })
      .catch((err) => {
        setModalTitle('Abort')
        setModalPayload(typeof err === 'object' ? err.toSting() : err)
        setOpenModal(true)
      })
      .finally(() => {
        setIsLoading(false)
        setSelectedPermission(undefined)
      })
  }

  const handleDeletePermissionClick = (permission: PermissionResponse) => {
    setSelectedPermission(permission)
    setDeleteModalOpen(true)
  }

  const deletePermission = () => {
    setDeleteModalOpen(false)
    setIsLoading(true)
    axios
      .delete(`/SASjsApi/permission/${selectedPermission?.permissionId}`)
      .then((res: any) => {
        fetchPermissions()
        setModalTitle('Success')
        setModalPayload('Permission deleted Successfully.')
        setOpenModal(true)
      })
      .catch((err) => {
        setModalTitle('Abort')
        setModalPayload(typeof err === 'object' ? err.toSting() : err)
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
        uriFilter={uriFilter}
        setUriFilter={setUriFilter}
        principalFilter={principalFilter}
        setPrincipalFilter={setPrincipalFilter}
        settingFilter={settingFilter}
        setSettingFilter={setSettingFilter}
        applyFilter={applyFilter}
        resetFilter={resetFilter}
      />
      <AddPermissionModal
        open={addPermissionModalOpen}
        handleOpen={setAddPermissionModalOpen}
        permissions={permissions}
        addPermission={addPermission}
      />
      <UpdatePermissionModal
        open={updatePermissionModalOpen}
        handleOpen={setUpdatePermissionModalOpen}
        permission={selectedPermission}
        updatePermission={updatePermission}
      />
      <DeleteModal
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
        deletePermission={deletePermission}
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
            <BootstrapTableCell>Uri</BootstrapTableCell>
            <BootstrapTableCell>Principal</BootstrapTableCell>
            <BootstrapTableCell>Type</BootstrapTableCell>
            <BootstrapTableCell>Setting</BootstrapTableCell>
            {appContext.isAdmin && (
              <BootstrapTableCell>Action</BootstrapTableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {permissions.map((permission) => (
            <TableRow key={permission.permissionId}>
              <BootstrapTableCell>{permission.uri}</BootstrapTableCell>
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
  if (permission.user) return permission.user?.displayName
  if (permission.group) return permission.group?.name
}

const displayPrincipalType = (permission: PermissionResponse) => {
  if (permission.user) return PrincipalType.User
  if (permission.group) return PrincipalType.Group
}
