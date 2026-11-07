import { useEffect, useState } from 'react'
import {
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import axios from 'axios'

import type { PermissionResponse } from '../../utils/types'
import { groupAppGrants } from './appGrants'

/**
 * Who can open which streamed app.
 *
 * The permission rules are the truth: a rule on `/AppStream/<name>` is what
 * decides access, so this groups those rules by app instead of asking the reader
 * to scan a table of routes. Read-only - the rules are edited in Settings →
 * Permissions, where a rule can be created, changed or deleted; this is the view
 * that says what the set of rules currently means for the apps.
 *
 * A grant on `/AppStream` itself admits every app and is not an app's rule, so
 * it is called out above the table rather than shown as though it belonged to
 * one.
 */
const AppStreamAccess = () => {
  const [permissions, setPermissions] = useState<PermissionResponse[] | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    axios
      .get('/SASjsApi/permission')
      .then((res) => {
        if (!cancelled) setPermissions(res.data ?? [])
      })
      .catch(() => {
        if (!cancelled) setError('The permission rules could not be read.')
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (error) return <Alert severity="error">{error}</Alert>
  if (!permissions) return <CircularProgress size={20} />

  const grants = groupAppGrants(permissions)
  const wholeStream = permissions.filter(
    (permission) =>
      permission.path === '/AppStream' && permission.setting === 'Grant'
  )

  if (!grants.length)
    return (
      <Typography variant="body2" color="text.secondary">
        No app has a permission rule of its own, so each one is open only to
        administrators. Add a rule on <code>/AppStream/&lt;name&gt;</code> in
        Settings and Permissions to share it.
      </Typography>
    )

  return (
    <>
      {wholeStream.length > 0 && (
        <Alert severity="info" sx={{ mb: 1 }}>
          A grant on <code>/AppStream</code> itself admits every app, so the
          rules below only narrow access for callers who do not hold it.
        </Alert>
      )}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>App</TableCell>
            <TableCell>Users</TableCell>
            <TableCell>Groups</TableCell>
            <TableCell>Denied</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {grants.map((grant) => (
            <TableRow key={grant.name}>
              <TableCell sx={{ fontFamily: 'monospace' }}>
                {grant.name}
              </TableCell>
              <TableCell>{grant.users.join(', ') || '-'}</TableCell>
              <TableCell>{grant.groups.join(', ') || '-'}</TableCell>
              <TableCell>{grant.denied.join(', ') || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}

export default AppStreamAccess
