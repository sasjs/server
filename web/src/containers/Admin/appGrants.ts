import type { PermissionResponse } from '../../utils/types'

/** Which app a route grant belongs to, or null when it is not an app grant. */
const APP_ROUTE_PREFIX = '/AppStream/'

export interface AppGrant {
  /**
   * What the rule names: an app's id, or the label an older rule was written
   * with. Both are honoured by the gate, so both appear here.
   */
  key: string
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
 * `/AppStream/<id>` is what decides who may open that app - `/AppStream/<label>`
 * on a rule written before apps had an id - so the rows are the truth. A grant on `/AppStream` itself is not an app grant - it admits every
 * app - so it is reported separately by the caller, not folded in here.
 *
 * An app nobody has a rule for does not appear; that is not a gap in this
 * function but the model: with deny-by-default, no rule means only the routes an
 * administrator is exempt from.
 */
export const groupAppGrants = (
  permissions: PermissionResponse[]
): AppGrant[] => {
  const byKey = new Map<string, AppGrant>()

  for (const permission of permissions) {
    if (!permission.path.startsWith(APP_ROUTE_PREFIX)) continue

    const key = permission.path.slice(APP_ROUTE_PREFIX.length)

    if (!key || key.includes('/')) continue

    const grant = byKey.get(key) ?? {
      key,
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

    byKey.set(key, grant)
  }

  return Array.from(byKey.values()).sort((a, b) => a.key.localeCompare(b.key))
}
