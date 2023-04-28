import axios from 'axios'
import { useState, useContext } from 'react'
import {
  PermissionResponse,
  RegisterPermissionPayload
} from '../../../../utils/types'
import AddPermission from '../components/addPermission'
import { PermissionsContext } from '../../../../context/permissionsContext'
import {
  findExistingPermission,
  findUpdatingPermission
} from '../../../../utils'

const useAddPermission = () => {
  const {
    permissions,
    fetchPermissions,
    setIsLoading,
    setPermissionResponsePayload,
    setOpenPermissionResponseModal
  } = useContext(PermissionsContext)

  const [addPermissionModalOpen, setAddPermissionModalOpen] = useState(false)

  const addPermission = async (
    permissionsToAdd: RegisterPermissionPayload[],
    permissionType: string,
    principalType: string,
    principal: string,
    permissionSetting: string
  ) => {
    setAddPermissionModalOpen(false)
    setIsLoading(true)

    const newAddedPermissions: PermissionResponse[] = []
    const updatedPermissions: PermissionResponse[] = []
    const errorPaths: string[] = []

    const existingPermissions: PermissionResponse[] = []
    const updatingPermissions: PermissionResponse[] = []
    const newPermissions: RegisterPermissionPayload[] = []

    permissionsToAdd.forEach((permission) => {
      const existingPermission = findExistingPermission(permissions, permission)
      if (existingPermission) {
        existingPermissions.push(existingPermission)
        return
      }

      const updatingPermission = findUpdatingPermission(permissions, permission)
      if (updatingPermission) {
        updatingPermissions.push(updatingPermission)
        return
      }

      newPermissions.push(permission)
    })

    for (const permission of newPermissions) {
      await axios
        .post('/SASjsApi/permission', permission)
        .then((res) => {
          newAddedPermissions.push(res.data)
        })
        .catch((error) => {
          errorPaths.push(permission.path)
        })
    }

    for (const permission of updatingPermissions) {
      await axios
        .patch(`/SASjsApi/permission/${permission.permissionId}`, {
          setting: permission.setting === 'Grant' ? 'Deny' : 'Grant'
        })
        .then((res) => {
          updatedPermissions.push(res.data)
        })
        .catch((error) => {
          errorPaths.push(permission.path)
        })
    }

    fetchPermissions()
    setIsLoading(false)
    setPermissionResponsePayload({
      permissionType,
      principalType,
      principal,
      permissionSetting,
      existingPermissions,
      updatedPermissions,
      newAddedPermissions,
      errorPaths
    })
    setOpenPermissionResponseModal(true)
  }

  const AddPermissionButton = () => (
    <AddPermission
      openModal={addPermissionModalOpen}
      setOpenModal={setAddPermissionModalOpen}
      addPermission={addPermission}
    />
  )

  return { AddPermissionButton, setAddPermissionModalOpen }
}

export default useAddPermission
