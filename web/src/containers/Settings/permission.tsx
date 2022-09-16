import { Box, Paper, Grid, CircularProgress } from '@mui/material'
import { styled } from '@mui/material/styles'
import PermissionTable from './internal/components/permissionTable'
import usePermission from './internal/hooks/usePermission'

const BootstrapGridItem = styled(Grid)({
  '&.MuiGrid-item': {
    maxWidth: '100%'
  }
})

const Permission = () => {
  const {
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
  } = usePermission()

  return isLoading ? (
    <CircularProgress
      style={{ position: 'absolute', left: '50%', top: '50%' }}
    />
  ) : (
    <Box className="permissions-page">
      <Grid container direction="column" spacing={1}>
        <BootstrapGridItem item xs={12}>
          <Paper elevation={3} sx={{ display: 'flex' }}>
            <FilterPermissionsButton />
            {isAdmin && <AddPermissionButton />}
          </Paper>
        </BootstrapGridItem>
        <BootstrapGridItem item xs={12}>
          <PermissionTable
            permissions={filterApplied ? filteredPermissions : permissions}
            handleUpdatePermissionClick={handleUpdatePermissionClick}
            handleDeletePermissionClick={handleDeletePermissionClick}
          />
        </BootstrapGridItem>
      </Grid>
      <PermissionResponseDialog />
      <UpdatePermissionDialog />
      <DeletePermissionDialog />
      <Dialog />
      <Snackbar />
    </Box>
  )
}

export default Permission
