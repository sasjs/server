/**
 * The shell helpers the mock-site build runs on.
 *
 * Separate from the build script so they can be tested: the retry that waits out
 * a registry publish window is the difference between a site that publishes and
 * one that fails on a release that landed seconds earlier, and a helper nothing
 * exercises is a helper whose bug only shows up in the deploy.
 */
import { execSync, spawnSync } from 'child_process'

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
