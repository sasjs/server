import type { PermissionResponse } from '../../utils/types'

/** Which app a route grant belongs to, or null when it is not an app grant. */
const APP_ROUTE_PREFIX = '/AppStream/'

export interface AppGrant {
  /** The stream's name, which is the last segment of its route. */
  name: string
  /** Principals holding a Grant on it. */
  users: string[]
  groups: string[]
  /** Principals with an explicit Deny, which outranks any grant. */
  denied: string[]
}

/**
 * The app grants, grouped by app.
 *
 * Read from the permission rules rather than from the app list: a rule on
 * `/AppStream/<name>` is what decides who may open that app, so the rows are the
 * truth. A grant on `/AppStream` itself is not an app grant - it admits every
 * app - so it is reported separately by the caller, not folded in here.
 *
 * An app nobody has a rule for does not appear; that is not a gap in this
 * function but the model: with deny-by-default, no rule means only the routes an
 * administrator is exempt from.
 */
export const groupAppGrants = (
  permissions: PermissionResponse[]
): AppGrant[] => {
  const byName = new Map<string, AppGrant>()

  for (const permission of permissions) {
    if (!permission.path.startsWith(APP_ROUTE_PREFIX)) continue

    const name = permission.path.slice(APP_ROUTE_PREFIX.length)

    if (!name || name.includes('/')) continue

    const grant = byName.get(name) ?? {
      name,
      users: [],
      groups: [],
      denied: []
    }

    const principal = permission.user?.username ?? permission.group?.name

    if (principal) {
      if (permission.setting === 'Grant') {
        if (permission.user) grant.users.push(principal)
        else grant.groups.push(principal)
      } else {
        grant.denied.push(principal)
      }
    }

    byName.set(name, grant)
  }

  return Array.from(byName.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  )
}
