/**
 * The shell helpers the mock-site build runs on.
 *
 * Separate from the build script so they can be tested: the retry that waits out
 * a registry publish window is the difference between a site that publishes and
 * one that fails on a release that landed seconds earlier, and a helper nothing
 * exercises is a helper whose bug only shows up in the deploy.
 */
import { execSync, spawnSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'

/**
 * Runs a command and shows its output.
 *
 * The output is CAPTURED and re-emitted rather than inherited. With
 * `stdio: 'inherit'` a failing child leaves `error.stdout` and `error.stderr`
 * null, so a caller cannot tell one failure from another - and the retry below
 * has to.
 */
export const run = (command, cwd) => {
  process.stdout.write(`\n> ${command}\n`)

  const output = execSync(command, { cwd, encoding: 'utf8' })

  if (output) process.stdout.write(output)
}

/** The attribute the login screen reads the demo's accounts from. */
export const DEMO_LOGIN_META = 'sasjs-demo-login'

/**
 * The demo's sign-in accounts, from the identity fixture the host authenticates
 * against.
 *
 * A visitor needs these: the demonstration site runs against a fixture rather
 * than a real directory, and a login screen with no way in is a wall. They are
 * taken from `host/identity.json` - the fixture the build ships, and the file the
 * host starts from - rather than restated here, so an account added to the
 * fixture appears on the screen without anyone remembering to copy it, and one
 * removed stops being advertised.
 *
 * It is the accounts the BUILD ships, which is not always what a particular
 * browser answers with: the host boots the identity snapshot the page hands it,
 * and a visitor who changes a password or adds an account keeps that change in
 * their own browser. Advertising the fixture is still the right default - it is
 * what a first-time visitor signs in with - but the screen is a description of
 * the deployment, not a promise about the store in front of them.
 *
 * Only accounts that can actually sign in are listed: a password is what makes an
 * account usable, and an inactive one is refused however right the password is.
 */
export const demoLogins = (identity) => {
  const users = Array.isArray(identity?.users) ? identity.users : []

  return users
    .filter(
      (user) =>
        user &&
        user.isActive !== false &&
        typeof user.username === 'string' &&
        user.username !== '' &&
        typeof user.password === 'string' &&
        user.password !== ''
    )
    .map((user) => ({
      username: user.username,
      password: user.password,
      admin: user.isAdmin === true
    }))
}

const escapeAttribute = (value) =>
  value.replace(
    /[&<>"]/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]
  )

/**
 * The meta tag that carries those accounts to the interface, or nothing.
 *
 * An attribute rather than a script: the shell is served from every route, and a
 * `<meta>` is inert - no execution, no CSP exception, and it reads the same on a
 * page that has not booted yet. The interface only shows the block when the tag
 * is there, and a real deployment never writes one.
 */
export const demoLoginMeta = (logins) =>
  logins.length === 0
    ? ''
    : `<meta name="${DEMO_LOGIN_META}" content="${escapeAttribute(
        JSON.stringify(logins)
      )}" />`

/**
 * The accounts the built site ships, read from its identity fixture.
 *
 * A build without the fixture publishes a site whose login screen offers no way
 * in, and CI stays green about it - so a missing file is a build failure, not a
 * site to ship without the block. The reasons it can be missing are named because
 * they have different fixes: a CLI older than the browser host, or a target that
 * turns that host off.
 */
export const readDemoLogins = (identityPath, cliVersion = 'the pinned CLI') => {
  if (!existsSync(identityPath))
    throw new Error(
      `The mock site has no identity fixture: expected ${identityPath}. ` +
        `Either @sasjs/cli ${cliVersion} predates the browser host writing one, ` +
        `or the target turns that host off (streamConfig.mockApi), so there is no ` +
        `sign-in to name and no demo to publish.`
    )

  return demoLogins(JSON.parse(readFileSync(identityPath, 'utf8')))
}

/** Everything a failed command said, whichever stream it said it on. */
const saidBy = (error) =>
  `${error?.stdout ?? ''}${error?.stderr ?? ''}${error?.message ?? ''}`

/** A blocking pause that behaves the same on every platform this runs on. */
const pauseFor = (milliseconds) =>
  spawnSync(process.execPath, [
    '-e',
    `setTimeout(function () {}, ${milliseconds})`
  ])

/**
 * The failures that mean "the registry has not caught up", not "the build is
 * broken": a version whose metadata is published before its tarball, which is
 * the minute after any CLI release.
 */
const REGISTRY_NOT_READY = /ETARGET|E404/

/**
 * Runs a command, and tries again when the registry is the thing that failed.
 *
 * Any other failure is thrown at once: a build that is broken should stay
 * broken. The pause is a parameter so a test can exercise the retry without
 * waiting fifteen seconds for it.
 */
export const runWhenTheRegistryIsReady = (
  command,
  { cwd, attempts = 3, pause = 15000 } = {}
) => {
  for (let attempt = 1; ; attempt++) {
    try {
      run(command, cwd)
      return attempt
    } catch (error) {
      const said = saidBy(error)

      if (attempt >= attempts || !REGISTRY_NOT_READY.test(said)) throw error

      process.stdout.write(
        '\nThe registry is not serving that package yet; trying again shortly.\n'
      )
      pauseFor(pause)
    }
  }
}
