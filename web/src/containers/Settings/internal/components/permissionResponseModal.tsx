import React from 'react'

import { Typography, DialogContent } from '@mui/material'

import { BootstrapDialog } from '../../../../components/modal'
import { BootstrapDialogTitle } from '../../../../components/dialogTitle'
import { PermissionResponse } from '../../../../utils/types'

export interface PermissionResponsePayload {
  permissionType: string
  principalType: string
  principal: string
  permissionSetting: string
  existingPermissions: PermissionResponse[]
  newAddedPermissions: PermissionResponse[]
  updatedPermissions: PermissionResponse[]
  errorPaths: string[]
}

type Props = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  payload: PermissionResponsePayload
}

const PermissionResponseModal = ({ open, setOpen, payload }: Props) => {
  const newAddedPermissionsLength = payload.newAddedPermissions.length
  const updatedPermissionsLength = payload.updatedPermissions.length
  const existingPermissionsLength = payload.existingPermissions.length
  const appliedPermissionsLength =
    newAddedPermissionsLength + updatedPermissionsLength

  return (
    <div>
      <BootstrapDialog onClose={() => setOpen(false)} open={open}>
        <BootstrapDialogTitle
          id="permission-response-modal"
          handleOpen={setOpen}
        >
          Permission Response
        </BootstrapDialogTitle>
        <DialogContent dividers>
          <Typography sx={{ fontWeight: 'bold', marginBottom: '15px' }}>
            {`${appliedPermissionsLength} "${payload.permissionSetting}", "${
              payload.permissionType
            }", "${payload.principalType}", "${payload.principal}" ${
              appliedPermissionsLength > 1 ? 'Rules' : 'Rule'
            }`}{' '}
            Applied:
          </Typography>

          {newAddedPermissionsLength > 0 && (
            <>
              <Typography>
                {`${newAddedPermissionsLength} ${
                  newAddedPermissionsLength > 1 ? 'Rules' : 'Rule'
                }`}{' '}
                Added:
              </Typography>
              <ul>
                {payload.newAddedPermissions.map((permission, index) => (
                  <li key={index}>{permission.path}</li>
                ))}
              </ul>
            </>
          )}

          {updatedPermissionsLength > 0 && (
            <>
              <Typography>
                {` ${updatedPermissionsLength} ${
                  updatedPermissionsLength > 1 ? 'Rules' : 'Rule'
                }`}{' '}
                Updated:
              </Typography>
              <ul>
                {payload.updatedPermissions.map((permission, index) => (
                  <li key={index}>{permission.path}</li>
                ))}
              </ul>
            </>
          )}

          {existingPermissionsLength > 0 && (
            <>
              <Typography>
                {`${existingPermissionsLength} ${
                  existingPermissionsLength > 1 ? 'Rules' : 'Rule'
                }`}{' '}
                Unchanged:
              </Typography>
              <ul>
                {payload.existingPermissions.map((permission, index) => (
                  <li key={index}>{permission.path}</li>
                ))}
              </ul>
            </>
          )}

          {payload.errorPaths.length > 0 && (
            <>
              <Typography style={{ color: 'red', marginTop: '10px' }}>
                Errors occurred for following paths:
              </Typography>
              <ul>
                {payload.errorPaths.map((path, index) => (
                  <li key={index}>
                    <Typography>{path}</Typography>
                  </li>
                ))}
              </ul>
            </>
          )}
        </DialogContent>
      </BootstrapDialog>
    </div>
  )
}

export default PermissionResponseModal
