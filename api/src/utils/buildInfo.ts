import { BUILD_INFO } from './buildInfo.generated'

export interface BuildInfo {
  /** Semantic version of the release this build came from, or 'dev'. */
  version: string
  /** Short git hash of the commit this build came from, or 'unknown'. */
  gitHash: string
  /** ISO timestamp of the build, or null when it is not known. */
  buildDate: string | null
}

/**
 * What produced the running binary: the release tag and the commit.
 *
 * The values are written into `buildInfo.generated.ts` by
 * `scripts/generateBuildInfo.ts`, which runs as part of `npm run initial` -
 * so a binary built by the release workflow carries the tag semantic-release
 * was about to cut, and a binary built by hand carries `git describe` output
 * or `dev`.
 *
 * Reading it from a generated module rather than the environment is
 * deliberate: `pkg` snapshots the compiled code into the executable, so a
 * constant travels into `api-linux` with it, whereas an environment variable
 * would have to be set on the host - which is exactly the thing a packaged
 * release cannot rely on.
 */
export const getBuildInfo = (): BuildInfo => ({ ...BUILD_INFO })

/** One-line form for support requests: `v3.2.2 (4a26a3d)`. */
export const formatBuildInfo = (info: BuildInfo = getBuildInfo()): string =>
  info.buildDate
    ? `${info.version} (${info.gitHash})`
    : `${info.version} (${info.gitHash}), build date unknown`
