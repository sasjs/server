import React from 'react'

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

type Props = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  permissionResponses: PermissionResponse[]
  errorResponses: any[]
}

const PermissionResponseModal = ({
  open,
  setOpen,
  permissionResponses,
  errorResponses
}: Props) => {
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
          {permissionResponses.length > 0 && (
            <>
              <Typography gutterBottom>Added Permissions</Typography>
              {permissionResponses.length > 0 && (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Path</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Setting</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {permissionResponses.map((permission, index) => {
                        return (
                          <TableRow key={index}>
                            <TableCell>{permission.path}</TableCell>
                            <TableCell>{permission.type}</TableCell>
                            <TableCell>{permission.setting}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {errorResponses.length > 0 && (
            <>
              <Typography style={{ color: 'red', marginTop: '10px' }}>
                Errors
              </Typography>
              <ul>
                {errorResponses.map((err, index) => (
                  <li key={index}>
                    <Typography>
                      Error occurred for Path: {err.permission.path}
                    </Typography>
                    <Typography>
                      {typeof err.error.response.data === 'object'
                        ? JSON.stringify(err.error.response.data)
                        : err.error.response.data}
                    </Typography>
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
