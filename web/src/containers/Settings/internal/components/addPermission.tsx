import React from 'react'
import { IconButton, Tooltip } from '@mui/material'
import { Add } from '@mui/icons-material'
import { RegisterPermissionPayload } from '../../../../utils/types'
import AddPermissionModal from './addPermissionModal'

type Props = {
  openModal: boolean
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>
  addPermission: (
    permissionsToAdd: RegisterPermissionPayload[],
    permissionType: string,
    principalType: string,
    principal: string,
    permissionSetting: string
  ) => Promise<void>
}

const AddPermission = ({ openModal, setOpenModal, addPermission }: Props) => {
  return (
    <>
      <Tooltip
        sx={{ marginLeft: 'auto' }}
        title="Add Permission"
        placement="bottom-end"
      >
        <IconButton onClick={() => setOpenModal(true)}>
          <Add />
        </IconButton>
      </Tooltip>
      <AddPermissionModal
        open={openModal}
        handleOpen={setOpenModal}
        addPermission={addPermission}
      />
    </>
  )
}

export default AddPermission
