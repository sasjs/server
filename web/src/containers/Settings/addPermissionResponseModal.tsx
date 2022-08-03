import React, { useMemo } from 'react'

import {
  Paper,
  Typography,
  DialogContent,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material'

import { BootstrapDialog } from '../../components/modal'
import { BootstrapDialogTitle } from '../../components/dialogTitle'
import { PermissionResponse } from '../../utils/types'

export interface PermissionResponsePayload {
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
  const rows = useMemo(() => {
    const paths: any = []

    const existingPermissionsLength = payload.existingPermissions.length
    const newAddedPermissionsLength = payload.newAddedPermissions.length
    const updatedPermissionsLength = payload.updatedPermissions.length
    if (
      existingPermissionsLength >= newAddedPermissionsLength &&
      existingPermissionsLength >= updatedPermissionsLength
    ) {
      payload.existingPermissions.forEach((permission, index) => {
        const obj = {
          existing: permission.path,
          newAdded:
            index < newAddedPermissionsLength
              ? payload.newAddedPermissions[index].path
              : '-',
          updated:
            index < updatedPermissionsLength
              ? payload.updatedPermissions[index].path
              : '-'
        }
        paths.push(obj)
      })
      return paths
    }

    if (
      newAddedPermissionsLength >= existingPermissionsLength &&
      newAddedPermissionsLength >= updatedPermissionsLength
    ) {
      payload.newAddedPermissions.forEach((permission, index) => {
        const obj = {
          newAdded: permission.path,
          existing:
            index < existingPermissionsLength
              ? payload.existingPermissions[index].path
              : '-',
          updated:
            index < updatedPermissionsLength
              ? payload.updatedPermissions[index].path
              : '-'
        }
        paths.push(obj)
      })
      return paths
    }

    if (
      updatedPermissionsLength >= existingPermissionsLength &&
      updatedPermissionsLength >= newAddedPermissionsLength
    ) {
      payload.updatedPermissions.forEach((permission, index) => {
        const obj = {
          updated: permission.path,
          existing:
            index < existingPermissionsLength
              ? payload.existingPermissions[index].path
              : '-',
          newAdded:
            index < newAddedPermissionsLength
              ? payload.newAddedPermissions[index].path
              : '-'
        }
        paths.push(obj)
      })
      return paths
    }

    return paths
  }, [payload])

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
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead sx={{ background: 'rgb(0,0,0, 0.3)' }}>
                <TableRow>
                  <TableCell>New</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell>Unchanged</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((obj: any, index: number) => {
                  return (
                    <TableRow key={index}>
                      <TableCell>{obj.newAdded}</TableCell>
                      <TableCell>{obj.updated}</TableCell>
                      <TableCell>{obj.existing}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>

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
