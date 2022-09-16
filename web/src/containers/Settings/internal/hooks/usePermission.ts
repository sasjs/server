import { useContext, useEffect } from 'react'
import { AppContext } from '../../../../context/appContext'
import { PermissionsContext } from '../../../../context/permissionsContext'
import { PermissionResponse } from '../../../../utils/types'
import useAddPermission from './useAddPermission'
import useUpdatePermissionModal from './useUpdatePermissionModal'
import useDeletePermissionModal from './useDeletePermissionModal'
import useFilterPermissions from './useFilterPermissions'

export enum PrincipalType {
  User = 'User',
  Group = 'Group'
}

const usePermission = () => {
  const { isAdmin } = useContext(AppContext)
  const {
    filterApplied,
    filteredPermissions,
    isLoading,
    permissions,
    Dialog,
    Snackbar,
    PermissionResponseDialog,
    fetchPermissions,
    setSelectedPermission
  } = useContext(PermissionsContext)

  const { AddPermissionButton } = useAddPermission()

  const { UpdatePermissionDialog, setUpdatePermissionModalOpen } =
    useUpdatePermissionModal()

  const { DeletePermissionDialog, setDeleteConfirmationModalOpen } =
    useDeletePermissionModal()

  const { FilterPermissionsButton } = useFilterPermissions()

  useEffect(() => {
    if (fetchPermissions) fetchPermissions()
  }, [fetchPermissions])

  const handleUpdatePermissionClick = (permission: PermissionResponse) => {
    setSelectedPermission(permission)
    setUpdatePermissionModalOpen(true)
  }

  const handleDeletePermissionClick = (permission: PermissionResponse) => {
    setSelectedPermission(permission)
    setDeleteConfirmationModalOpen(true)
  }

  return {
    filterApplied,
    filteredPermissions,
    isAdmin,
    isLoading,
    permissions,
    AddPermissionButton,
    UpdatePermissionDialog,
    DeletePermissionDialog,
    FilterPermissionsButton,
    handleDeletePermissionClick,
    handleUpdatePermissionClick,
    PermissionResponseDialog,
    Dialog,
    Snackbar
  }
}

export default usePermission
