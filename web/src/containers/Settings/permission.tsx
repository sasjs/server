import { Box, Paper, Grid, CircularProgress, Typography } from '@mui/material'
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
        {permissions.length === 0 ? (
          // An empty table says nothing about WHY it is empty, and the rules are
          // deny-by-default - so the state is explained rather than left to look
          // like a failure or an oversight.
          <BootstrapGridItem item xs={12}>
            <Paper elevation={3} sx={{ padding: '20px' }}>
              <Typography variant="h6" sx={{ marginBottom: '10px' }}>
                No permission rules
              </Typography>
              <Typography>
                {isAdmin
                  ? 'Routes that accept permissions deny by default, so a user or a group needs a Grant before anyone can use one. The add button above creates a rule.'
                  : 'You hold no permission rules. Routes that accept permissions deny by default; an administrator grants access to a user or to a group, and the rules that apply to you appear here.'}
              </Typography>
            </Paper>
          </BootstrapGridItem>
        ) : (
          <BootstrapGridItem item xs={12}>
            <PermissionTable
              permissions={filterApplied ? filteredPermissions : permissions}
              handleUpdatePermissionClick={handleUpdatePermissionClick}
              handleDeletePermissionClick={handleDeletePermissionClick}
            />
          </BootstrapGridItem>
        )}
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
