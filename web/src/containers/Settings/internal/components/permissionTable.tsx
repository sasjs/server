import { useContext } from 'react'

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material'

import EditIcon from '@mui/icons-material/Edit'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'

import { styled } from '@mui/material/styles'

import { PermissionResponse } from '../../../../utils/types'

import { AppContext } from '../../../../context/appContext'
import { displayPrincipal, displayPrincipalType } from '../helper'

const BootstrapTableCell = styled(TableCell)({
  textAlign: 'left'
})

export enum PrincipalType {
  User = 'User',
  Group = 'Group'
}

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
            <BootstrapTableCell>Path</BootstrapTableCell>
            <BootstrapTableCell>Permission Type</BootstrapTableCell>
            <BootstrapTableCell>Principal</BootstrapTableCell>
            <BootstrapTableCell>Principal Type</BootstrapTableCell>
            <BootstrapTableCell>Setting</BootstrapTableCell>
            {appContext.isAdmin && (
              <BootstrapTableCell>Action</BootstrapTableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {permissions.map((permission) => (
            <TableRow key={permission.permissionId}>
              <BootstrapTableCell>{permission.path}</BootstrapTableCell>
              <BootstrapTableCell>{permission.type}</BootstrapTableCell>
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

export default PermissionTable
