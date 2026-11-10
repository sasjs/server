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
 * The permission rules are the truth: a rule on `/AppStream/<id>` is what decides
 * access, so this groups those rules by app instead of asking the reader to scan
 * a table of routes. Read-only - the rules are edited in Settings → Permissions,
 * where a rule can be created, changed or deleted; this is the view that says
 * what the set of rules currently means for the apps.
 *
 * A rule written before apps had an id names the app's label instead, and both
 * spellings are honoured by the gate - so the rows are keyed by whatever the
 * rule names, and the label is resolved from the app list where the rule names an
 * id, rather than showing a reader a UUID where an app name belongs.
 *
 * A grant on `/AppStream` itself admits every app and is not an app's rule, so
 * it is called out above the table rather than shown as though it belonged to
 * one.
 */
const AppStreamAccess = () => {
  const [permissions, setPermissions] = useState<PermissionResponse[] | null>(
    null
  )
  // The app a rule names, where the rule names one this deployment publishes.
  const [labels, setLabels] = useState<Map<string, string>>(new Map())
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

    // A failure here is not an error the reader can act on: the rules are still
    // readable, and a row keeps the key the rule names.
    axios
      // the canonical spelling: the mock host answers this one today (see the
      // Apps screen), and the server answers both
      .get('/AppStream/apps.json')
      .then((res) => {
        if (cancelled) return

        const rows: { id: string; name: string }[] = res.data?.apps ?? []

        setLabels(new Map(rows.map((app) => [app.id, app.name])))
      })
      .catch(() => undefined)

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
        administrators. Add a rule on <code>/AppStream/&lt;id&gt;</code> in
        Settings and Permissions to share it - the id is in the app's URL.
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
            <TableRow key={grant.key}>
              <TableCell sx={{ fontFamily: 'monospace' }}>
                {labels.get(grant.key) ?? grant.key}
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
