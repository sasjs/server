import { useState } from 'react'
import PermissionResponseModal, {
  PermissionResponsePayload
} from '../components/permissionResponseModal'

const usePermissionResponseModal = () => {
  const [openPermissionResponseModal, setOpenPermissionResponseModal] =
    useState(false)
  const [permissionResponsePayload, setPermissionResponsePayload] =
    useState<PermissionResponsePayload>({
      permissionType: '',
      principalType: '',
      principal: '',
      permissionSetting: '',
      existingPermissions: [],
      newAddedPermissions: [],
      updatedPermissions: [],
      errorPaths: []
    })

  const PermissionResponseDialog = () => (
    <PermissionResponseModal
      open={openPermissionResponseModal}
      setOpen={setOpenPermissionResponseModal}
      payload={permissionResponsePayload}
    />
  )

  return {
    PermissionResponseDialog,
    setOpenPermissionResponseModal,
    setPermissionResponsePayload
  }
}

export default usePermissionResponseModal
