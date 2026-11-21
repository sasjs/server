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
 * What produced this build, as `v8.7.0 (60015df)`: the release tag and the
 * commit. These are the names `api/scripts/generateBuildInfo.ts` reads, kept
 * the same so one build can be named by either.
 */
export const BUILD_VERSION_ENV = 'SASJS_SERVER_VERSION'
export const BUILD_HASH_ENV = 'SASJS_SERVER_GIT_HASH'

/** The output of a git command, or `fallback` when git cannot answer. */
const gitOutput = (command, cwd, fallback) => {
  try {
    return (
      execSync(command, {
        cwd,
        stdio: ['ignore', 'pipe', 'ignore']
      })
        .toString()
        .trim() || fallback
    )
  } catch (error) {
    // no git, or a directory that is not a checkout: an export of the source,
    // a tarball unpacked somewhere. The build still has to run.
    return fallback
  }
}

/**
 * The release this site is built from, in the form a running server reports.
 *
 * The rule is `api/scripts/generateBuildInfo.ts`'s, restated rather than
 * imported: that module is TypeScript and the mock build runs without the API's
 * dependencies installed, so it cannot be loaded from here. What it cannot
 * restate is where the answer comes from - `git describe --tags` in the
 * checkout, so the release a site names is the tag its source was at, and no
 * number in this repository has to be moved when a release is cut. The
 * environment overrides exist for the same reason they do there: the release
 * workflow cuts the tag before it builds, and a checkout that has not fetched
 * tags yet would otherwise name the previous one.
 *
 * `git describe --tags --always` degrades to the commit when the checkout has no
 * tags at all (a shallow one), which is what the site then says - a short hash,
 * which is true, rather than a release number that is not.
 */
export const buildIdentity = ({ cwd, env = process.env } = {}) => {
  const fromEnv = (name) => {
    const value = env[name]

    return value && value.trim() ? value.trim() : undefined
  }

  const rawHash =
    fromEnv(BUILD_HASH_ENV) ||
    gitOutput('git rev-parse --short HEAD', cwd, 'unknown')
  // CI passes the full SHA; the screen and a support ticket want the short form.
  const gitHash = rawHash.length > 12 ? rawHash.slice(0, 7) : rawHash
  const version =
    fromEnv(BUILD_VERSION_ENV) ||
    gitOutput('git describe --tags --always --dirty', cwd, 'dev')

  return { version, gitHash, display: `${version} (${gitHash})` }
}

/** Where the worker states the release it reports to `/SASjsApi/info`. */
const INFO_STAMP_POINT = 'const SERVICES = {'

/**
 * Where the worker states the release its diagnostics screen reports, written
 * with the placeholder the `@sasjs/api` browser build carries.
 */
const DIAGNOSTICS_STAMP_POINT =
  "build: { version: 'dev', gitHash: 'unknown', buildDate: null },"

/**
 * The published worker, with this build's release written into it.
 *
 * The host comes from `@sasjs/cli` and names no release, because a worker is not
 * a package: it answers `dev`. That is the one thing about the site that is not
 * already the real interface - every screen asks `/SASjsApi/info` what produced
 * the build, and a demonstration of a server should answer the way the server
 * does. So the answer is stamped into the ONE file that reports it, from the tag
 * the site was built at.
 *
 * Stamped into the worker rather than into `host/api-browser.js`, which holds
 * the same value: that file is cache-busted by a hash of its content, and a
 * change made after the CLI computed it would reach a returning visitor under a
 * URL that promises the bytes did not move. The worker's bytes are compared on
 * every visit, so a stamped build installs like any other.
 *
 * Both points are required and a missing one throws: they are the CLI's text,
 * and a CLI release that renames one would otherwise publish a site reporting
 * `dev` with a green pipeline - the thing this stamp exists to stop.
 */
export const stampedWorker = (
  source,
  { version, gitHash, display, buildDate },
  { cliVersion = 'the pinned CLI' } = {}
) => {
  for (const point of [INFO_STAMP_POINT, DIAGNOSTICS_STAMP_POINT])
    if (!source.includes(point))
      throw new Error(
        `The published worker does not carry "${point}", so the release it reports cannot be set. ` +
          `That text comes from @sasjs/cli ${cliVersion}: check the CLI_VERSION pin in mock/build.mjs against what the release now writes.`
      )

  const stamp = (text) => () => text

  return (
    source
      // The diagnostics answer names the release, the commit and the date the
      // interface was assembled - what the Admin screen's Release card shows.
      .replace(
        DIAGNOSTICS_STAMP_POINT,
        stamp(
          `build: { version: ${JSON.stringify(version)}, gitHash: ${JSON.stringify(
            gitHash
          )}, buildDate: ${JSON.stringify(buildDate)} },`
        )
      )
      // The copy `createInfoService` takes is made below this line, so the
      // property has to be set before it - the package hands back the same
      // object, so setting it here reaches the service's configuration.
      .replace(
        INFO_STAMP_POINT,
        stamp(
          `// written by mock/build.mjs: the release this site was built from\n` +
            `API.BROWSER_INFO.version = ${JSON.stringify(display)}\n\n` +
            INFO_STAMP_POINT
        )
      )
  )
}

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
