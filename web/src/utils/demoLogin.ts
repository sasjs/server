/**
 * The demo's sign-in accounts, as the published page states them.
 *
 * A browser-hosted site authenticates against an identity fixture rather than a
 * directory, so its login screen has one account per demo persona and no one to
 * ask which one to use. The mock build puts them in a `<meta>` on every copy of
 * the shell (`demoLoginMeta` in `mock/lib.mjs`), read from the `host/identity.json`
 * the build ships - so the screen cannot advertise an account the deployment does
 * not contain.
 *
 * It is what the BUILD states, not what a particular browser holds: a visitor who
 * changes a password or creates an account keeps that in their own profile, and
 * the host answers from there. A first-time visitor is the one this is for.
 *
 * Absent on a real deployment, and that is the whole switch: no meta, no block.
 * Nothing here decides whether the account works; the server still answers the
 * sign-in.
 */

/** The attribute name the build writes. */
export const DEMO_LOGIN_META = 'sasjs-demo-login'

/** One account a visitor may sign in with. */
export type DemoLogin = {
  username: string
  password: string
  /** Whether the account is an administrator - worth saying, it changes the screens. */
  admin: boolean
}

/**
 * The accounts a meta's `content` states, or none.
 *
 * Read defensively: the attribute is build output, and a page whose shell was
 * served from an older deploy, or edited by hand, must not take the login screen
 * down with it. Anything that is not a list of usable accounts is no list.
 */
export const parseDemoLogins = (
  raw: string | null | undefined
): DemoLogin[] => {
  if (!raw) return []

  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    return []
  }

  if (!Array.isArray(parsed)) return []

  return parsed
    .filter(
      (entry): entry is Record<string, unknown> =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as Record<string, unknown>).username === 'string' &&
        (entry as Record<string, unknown>).username !== '' &&
        typeof (entry as Record<string, unknown>).password === 'string' &&
        (entry as Record<string, unknown>).password !== ''
    )
    .map((entry) => ({
      username: entry.username as string,
      password: entry.password as string,
      admin: entry.admin === true
    }))
}

/** The accounts this page carries, if it carries any. */
export const demoLogins = (): DemoLogin[] => {
  if (typeof document === 'undefined') return []

  const meta = document.querySelector(`meta[name="${DEMO_LOGIN_META}"]`)

  return parseDemoLogins(meta?.getAttribute('content'))
}
