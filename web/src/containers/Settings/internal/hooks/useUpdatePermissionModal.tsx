import axios from 'axios'
import { useState, useContext } from 'react'
import UpdatePermissionModal from '../components/updatePermissionModal'
import { PermissionsContext } from '../../../../context/permissionsContext'
import { AlertSeverityType } from '../../../../components/snackbar'

const useUpdatePermissionModal = () => {
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
  const [updatePermissionModalOpen, setUpdatePermissionModalOpen] =
    useState(false)

  const updatePermission = (setting: string) => {
    setUpdatePermissionModalOpen(false)
    setIsLoading(true)
    axios
      .patch(`/SASjsApi/permission/${selectedPermission?.uid}`, {
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

  const UpdatePermissionDialog = () => (
    <UpdatePermissionModal
      open={updatePermissionModalOpen}
      handleOpen={setUpdatePermissionModalOpen}
      permission={selectedPermission}
      updatePermission={updatePermission}
    />
  )

  return { UpdatePermissionDialog, setUpdatePermissionModalOpen }
}

export default useUpdatePermissionModal
