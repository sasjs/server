import axios from 'axios'
import { useState, useContext } from 'react'
import { PermissionsContext } from '../../../../context/permissionsContext'
import { AlertSeverityType } from '../../../../components/snackbar'
import DeleteConfirmationModal from '../../../../components/deleteConfirmationModal'

const useDeletePermissionModal = () => {
  const {
    selectedPermission,
    setSelectedPermission,
    fetchPermissions,
    setIsLoading,
    setSnackbarMessage,
    setSnackbarSeverity,
    setOpenSnackbar,
    setModalTitle,
    setModalPayload,
    setOpenModal
  } = useContext(PermissionsContext)
  const [deleteConfirmationModalOpen, setDeleteConfirmationModalOpen] =
    useState(false)

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

  const DeletePermissionDialog = () => (
    <DeleteConfirmationModal
      open={deleteConfirmationModalOpen}
      setOpen={setDeleteConfirmationModalOpen}
      message="Are you sure you want to delete this permission?"
      _delete={deletePermission}
    />
  )

  return { DeletePermissionDialog, setDeleteConfirmationModalOpen }
}

export default useDeletePermissionModal
