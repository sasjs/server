import AdmZip from 'adm-zip'
import axios from 'axios'
import crypto from 'crypto'
import { execFile } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import {
  createFile,
  createFolder,
  deleteFolder,
  fileExists,
  listFilesInFolder,
  readFile
} from '@sasjs/utils'

import {
  apiRoot,
  sasJSCoreMacros,
  sasJSCoreMacrosInfo
} from '../src/utils/file'

/**
 * The SAS_PACKAGES release the macros are taken from by default, pinned so a
 * pull request and a local build are reproducible: the archive is fetched as one
 * file from codeload and its SHA-256 is checked against
 * `SAS_PACKAGES_RELEASE_SHA256` below.
 *
 * A release build does not use the pin - it resolves the newest upstream tag
 * (see `resolveRelease`) and records it, so a published version carries the
 * freshest macros without anyone editing these constants.
 */
export const SAS_PACKAGES_RELEASE = '20261111'

/** The SHA-256 of that release's zip archive. */
export const SAS_PACKAGES_RELEASE_SHA256 =
  '8bbb0c1ae746faa3c9f1d0d136bce9337fd28fa89e1d9df1abc8d6ea763691c9'

/** The repository the macros come from. */
export const sasPackagesRepoUrl = 'https://github.com/yabwon/SAS_PACKAGES'

/**
 * Where the release archive is downloaded from. `tag` is explicit because a
 * release build resolves the newest upstream tag instead of using the pin.
 */
export const sasPackagesArchiveUrl = (
  tag: string = SAS_PACKAGES_RELEASE
): string =>
  `https://codeload.github.com/yabwon/SAS_PACKAGES/zip/refs/tags/${tag}`

/**
 * What the last download installed, written for `generateBuildInfo.ts` so a
 * binary can report the macro release it carries - which is not always the pin,
 * because a release resolves the newest upstream tag. Gitignored build state.
 */
export const resolvedReleaseFile = path.join(
  apiRoot,
  '.sas-packages-resolved.json'
)

/** The release a download used, and whether it was resolved or the pin. */
export interface ResolvedRelease {
  /** The upstream tag the macros came from. */
  tag: string
  /** What the archive must hash to; absent when the tag was resolved at build time. */
  expectedSha256?: string
  /** `pinned`, `latest` (resolved now), or `pinned-fallback` (the lookup failed). */
  source: 'pinned' | 'latest' | 'pinned-fallback'
  /** Why the pin was used instead of the newest tag, when it was. */
  fallback?: string
  /**
   * The tag's file list and blob hashes, from the forge. A resolved release has
   * no checksum of the archive to compare against, so this is what the
   * extracted macros are verified against.
   */
  tree?: Record<string, string>
}

/**
 * The tags of the macros repository.
 *
 * `git ls-remote` rather than the GitHub API: it needs no token and spends none
 * of the per-source-IP API budget that the file-by-file download this replaces
 * exhausted.
 */
export const latestReleaseTags = async (
  repoUrl: string = sasPackagesRepoUrl
): Promise<string[]> => {
  const { stdout } = await promisify(execFile)(
    'git',
    ['ls-remote', '--tags', repoUrl],
    // A connection that stalls rather than fails would otherwise hold the
    // release job open until the workflow times out.
    { timeout: downloadTimeoutMs }
  )

  return stdout
    .split('\n')
    .map((line) => line.split('\t')[1])
    .filter(Boolean)
    .map((ref) => ref.replace(/^refs\/tags\//, '').replace(/\^\{\}$/, ''))
}

/** The highest tag, compared numerically so `20261111` beats `2026129`. */
export const newestTag = (tags: string[]): string | undefined =>
  // The upstream names releases by date. Anything else - a `v1`, a notes tag -
  // sorts above the dates under numeric collation and is not a release this can
  // download, so it is filtered out rather than resolved and then 404ing.
  [...tags]
    .filter((tag) => /^\d{8}$/.test(tag))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
    .pop()

/** The git blob hash of some bytes, which is what a tree listing names. */
export const gitBlobHash = (content: Buffer): string =>
  crypto
    .createHash('sha1')
    .update(`blob ${content.length}\u0000`)
    .update(content)
    .digest('hex')

/**
 * A tag's files and blob hashes, from the forge's API.
 *
 * This is the authenticated source for a resolved release: the archive comes
 * from codeload, which publishes no checksum, but the tag points at a commit
 * whose tree names a hash for every file - so the bytes that get installed can
 * be checked against the tag they claim to come from. One request per release
 * build, sent to api.github.com with the token when there is one (that is the
 * host a token belongs to).
 */
export const tagTree = async (
  tag: string,
  token: string | undefined = process.env.GITHUB_TOKEN
): Promise<Record<string, string>> => {
  const res = await axios.get(
    `https://api.github.com/repos/yabwon/SAS_PACKAGES/git/trees/${tag}`,
    {
      params: { recursive: '1' },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: downloadTimeoutMs
    }
  )

  const tree: Record<string, string> = {}

  for (const entry of res.data?.tree ?? [])
    if (entry.type === 'blob') tree[entry.path] = entry.sha

  if (!Object.keys(tree).length)
    throw new Error(`${tag} lists no files in its tree`)

  return tree
}

/** The first few names, then a count: enough for a log line, not the whole list. */
const summarise = (names: string[]): string =>
  `${names.slice(0, 5).join(', ')}${names.length > 5 ? `, and ${names.length - 5} more` : ''}`

/**
 * Checks the extracted macros against the tag's tree, in both directions: every
 * macro the archive carries must hash to what the tree names, and every macro
 * the tree lists must be in the archive.
 *
 * The second direction is the one worth spelling out: a check that only looks at
 * what was downloaded accepts an archive that is missing files, and an
 * incomplete install is exactly the disagreement between archive and tag that
 * this exists to catch.
 *
 * Neither outcome is a fallback - both mean the archive and the tag disagree, so
 * the build stops before anything is installed.
 */
export const verifyAgainstTree = (
  tag: string,
  macros: { name: string; content: Buffer }[],
  tree: Record<string, string>
) => {
  const installed = macros.map((macro) => macro.name)
  const listed = Object.keys(tree)
    .filter((entryPath) => entryPath.startsWith(macrosFolder))
    .map((entryPath) => macroFileName(entryPath))
    .filter((name) => name && !isUnsafeMacroName(name))

  const mismatched = macros
    .filter(
      (macro) =>
        tree[`${macrosFolder}${macro.name}`] !== gitBlobHash(macro.content)
    )
    .map((macro) => macro.name)

  const missing = listed.filter((name) => !installed.includes(name))

  if (!mismatched.length && !missing.length) return

  const detail = [
    mismatched.length
      ? `${mismatched.length} file(s) do not match the tag's tree (${summarise(mismatched)})`
      : '',
    missing.length
      ? `${missing.length} macro(s) the tag lists are absent from the archive (${summarise(missing)})`
      : ''
  ]
    .filter(Boolean)
    .join('; ')

  throw new Error(
    `Failed to install the SAS_PACKAGES macros from ${tag}: ${detail}. The tag may have moved, or the archive was not what it claims.`
  )
}

/**
 * Whether this build installs the newest upstream release. The release workflow
 * sets `SASJS_SAS_PACKAGES_LATEST`; a pull request, a local start and anything
 * built from the published package use the pin.
 */
const latestRequested = (): boolean =>
  ['1', 'true'].includes(
    (process.env.SASJS_SAS_PACKAGES_LATEST || '').trim().toLowerCase()
  )

/**
 * The checksum the last download recorded for `tag`.
 *
 * A resolved release has no pin to compare against, so this is what lets the
 * second run in the same job - `initial`, after `prebuild` downloaded - treat
 * the cache the first run wrote as complete.
 */
const recordedSha256 = async (
  tag: string,
  file: string = resolvedReleaseFile
): Promise<string | undefined> => {
  try {
    const recorded = JSON.parse(await fs.promises.readFile(file, 'utf8'))

    return recorded.tag === tag && typeof recorded.sha256 === 'string'
      ? recorded.sha256
      : undefined
  } catch (error) {
    return undefined
  }
}

/**
 * Which release this download installs.
 *
 * The pin is the default, so a pull request and a developer build install the
 * release they were tested against. A release build asks for the newest tag
 * instead - it is the artefact that should carry the freshest macros - and
 * falls back to the pin, saying so, if the lookup fails: a release is better
 * shipped from a known release than not shipped.
 */
export const resolveRelease = async ({
  resolveLatest = false,
  listTags = latestReleaseTags,
  fetchTree = tagTree
}: {
  resolveLatest?: boolean
  listTags?: () => Promise<string[]>
  fetchTree?: (tag: string) => Promise<Record<string, string>>
} = {}): Promise<ResolvedRelease> => {
  if (!resolveLatest)
    return {
      tag: SAS_PACKAGES_RELEASE,
      expectedSha256: SAS_PACKAGES_RELEASE_SHA256,
      source: 'pinned'
    }

  try {
    const tag = newestTag(await listTags())

    if (!tag)
      throw new Error('the repository lists no date-shaped release tags')

    // Fetched before the archive: without it there is nothing to verify the
    // download against, and the pin - which has a checksum - is the safer
    // answer than an unverifiable "latest".
    const tree = await fetchTree(tag)

    return { tag, source: 'latest', tree }
  } catch (error) {
    console.warn(
      `Could not resolve and verify the newest SAS_PACKAGES release; using the pinned release ${SAS_PACKAGES_RELEASE}: ${message(
        error
      )}`
    )

    return {
      tag: SAS_PACKAGES_RELEASE,
      expectedSha256: SAS_PACKAGES_RELEASE_SHA256,
      source: 'pinned-fallback',
      fallback: message(error)
    }
  }
}

/** Records which release was installed, for the build info and the release notes. */
const writeResolvedRelease = async (
  release: ResolvedRelease,
  sha256: string,
  file: string = resolvedReleaseFile
) => {
  // The tree is not recorded: it is large, and its only use is verifying the
  // download that just happened.
  const { tree, ...recorded } = release

  await fs.promises.writeFile(
    file,
    JSON.stringify({ ...recorded, sha256 }, null, 2) + '\n'
  )
}

/**
 * Where the downloaded macros are kept between starts.
 *
 * It must not sit anywhere under `sas/`: `copySASjsCore` deletes and recreates
 * `sas/sasautos` on every start, and removes the legacy `sas/sasautos-download`
 * sibling, so a cache there would be wiped and every start would fetch again.
 * It sits beside `sas/` instead, and only the download rebuilds it - so it is
 * the completion marker for sasjs/server#312's skip.
 */
export const downloadCache = path.join(apiRoot, '.sasautos-download')
const downloadCacheList = path.join(downloadCache, '.macrolist')

/** Where the macros sit inside a release archive, and in the repository tree. */
const macrosFolder = 'SPF/Macros/'

/** That folder, anchored at the start of an archive entry's name. */
const macrosFolderInArchive = new RegExp(
  `^([^/]+/)?${macrosFolder.replace('/', '\\/')}`
)

/**
 * The file name a macro is stored under: the SPF/Macros path is stripped,
 * whether it is prefixed by the archive's root folder or not; the rest is
 * the name.
 */
export const macroFileName = (pathInRepo: string): string =>
  pathInRepo.replace(macrosFolderInArchive, '')

/**
 * A macro's name in the archive is a plain file name: a `.` or `..` segment
 * would target a directory, a `/` would reach into a subfolder or out of the
 * macros folder, and a `\` is a separator on the Windows the server is also
 * packaged for - each is an escape, and a pinned release carries none.
 */
const isUnsafeMacroName = (name: string): boolean =>
  name === '.' || name === '..' || name.includes('/') || name.includes('\\')

/**
 * Refreshes the cache even when it looks current. Set by passing `--force` to
 * the script (`npm run downloadMacros -- --force`), which `prebuild` does so a
 * build never installs a stale snapshot.
 */
const force = process.argv.includes('--force')

/** Attempts for the archive download. */
const attempts = 3

/**
 * How long one attempt may take before it is abandoned and retried. A stalled
 * connection would otherwise hold `npm run build` and `npm start` open with no
 * message.
 *
 * The pinned archive is 13,574,154 bytes - the whole repository zip, not only
 * its macros - so 120 seconds leaves room for about 113 KB/s sustained, well
 * under what a CI runner or a laptop manages, and three attempts before the
 * build fails. A shorter budget spends all the retries on a slow-but-healthy
 * download, which is the stall the timeout exists to avoid, from the other
 * side.
 */
const downloadTimeoutMs = 120000

/**
 * A 5xx, a timeout or a connection reset is the forge having a bad day, not the
 * request: retrying is the right response and reporting it as a rate limit is
 * not.
 */
const isRetryable = (error: unknown): boolean => {
  const status = (error as { response?: { status?: number } })?.response?.status

  return status === undefined || status >= 500 || status === 429
}

/** Why the last attempt failed, in terms an operator can act on. */
const describe = (error: unknown): string => {
  const status = (error as { response?: { status?: number } })?.response?.status

  if (status === 504)
    return 'the archive host answered 504 (Gateway Time-out) - that is the forge, not this build'

  if (status === 403 || status === 429)
    return `the archive host refused the request with ${status}; it throttles per source IP, so retry once it clears`

  return error instanceof Error ? error.message : String(error)
}

const message = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

/** The macro names a list file records, one per line. */
const readList = async (listPath: string): Promise<string[]> =>
  (await readFile(listPath))
    .split('\n')
    .map((name) => name.trim())
    .filter(Boolean)

/** A file's SHA-256, over its bytes rather than a decoded string. */
const fileSha256 = async (filePath: string): Promise<string> =>
  crypto
    .createHash('sha256')
    .update(await fs.promises.readFile(filePath))
    .digest('hex')

/**
 * A digest of the cache's contents: every file's hash and name, sorted, hashed
 * together.
 *
 * The release marker proves which release the cache claims to hold; this
 * proves it holds that release. Without it a cached macro that was edited or
 * swapped after the download would be installed silently, and the archive
 * checksum - the reason the release is pinned - would only be checked on the
 * runs that actually download.
 */
export const cacheContentDigest = async (
  cacheFolder: string,
  names: string[]
): Promise<string> => {
  const lines: string[] = []

  for (const name of [...names].sort())
    lines.push(`${await fileSha256(path.join(cacheFolder, name))} ${name}`)

  return crypto.createHash('sha256').update(lines.join('\n')).digest('hex')
}

/**
 * Writes the cache's three records, in the order that makes the marker the
 * completion signal: the files are already copied, then the list, then the
 * contents digest, then the release marker. A cache interrupted before the
 * last write looks incomplete to `cachedDownloadsAreCurrent`.
 */
export const writeCacheManifest = async (
  cacheFolder: string,
  names: string[],
  expectedSha256: string = SAS_PACKAGES_RELEASE_SHA256
) => {
  await createFile(path.join(cacheFolder, '.macrolist'), names.join('\n'))
  await createFile(
    path.join(cacheFolder, '.content-sha256'),
    await cacheContentDigest(cacheFolder, names)
  )
  await createFile(path.join(cacheFolder, '.release-sha256'), expectedSha256)
}

/**
 * Writes the inventory of a macros folder: every file in it, one per line,
 * excluding the inventory itself. `api/src/utils/copySASjsCore.ts` copies the
 * drive's macros from this list, so it has to describe the whole folder - the
 * core macros and the downloaded ones together.
 */
const writeInventory = async (folder: string, listPath: string) => {
  const names = (await listFilesInFolder(folder)).filter(
    (name) => name !== path.basename(listPath)
  )

  await createFile(listPath, names.join('\n'))
}

/**
 * Whether the download cache holds a complete payload.
 *
 * The cache list names every copied file, the contents digest covers those
 * files, and the release marker names the release. All three must agree before
 * the download is skipped - the point of sasjs/server#312, where every
 * `npm start` in development re-downloaded all of them.
 *
 * The release marker is written last, so a cache that was only half populated
 * has no marker (or names a missing file, or a digest that does not match),
 * and this answers `false`: `downloadMacros` fetches instead of installing a
 * partial tree. `forced` is the deliberate refresh - `--force` on the script -
 * and answers `false` regardless.
 */
export const cachedDownloadsAreCurrent = async (
  cacheFolder: string = downloadCache,
  listPath: string = downloadCacheList,
  forced: boolean = force,
  expectedSha256: string = SAS_PACKAGES_RELEASE_SHA256
): Promise<boolean> => {
  if (forced) return false
  if (!(await fileExists(listPath))) return false
  const marker = path.join(cacheFolder, '.release-sha256')
  if (!(await fileExists(marker))) return false
  if ((await readFile(marker)).trim() !== expectedSha256) return false

  const names = await readList(listPath)

  if (!names.length) return false

  for (const name of names) {
    if (!(await fileExists(path.join(cacheFolder, name)))) return false
  }

  const digestPath = path.join(cacheFolder, '.content-sha256')

  if (!(await fileExists(digestPath))) return false

  return (
    (await readFile(digestPath)).trim() ===
    (await cacheContentDigest(cacheFolder, names))
  )
}

/**
 * Puts the cached macros into the api's macros folder and rewrites its
 * inventory.
 *
 * This is what a start does instead of downloading: `copySASjsCore` has just
 * recreated the folder with the core macros only, so the cached downloads are
 * laid over them and `.macrolist` is rewritten from the folder. Returns
 * `false` when the cache is not complete, so the caller downloads instead.
 */
export const installFromCache = async (
  folder: string = sasJSCoreMacros,
  cacheFolder: string = downloadCache,
  listPath: string = sasJSCoreMacrosInfo,
  forced: boolean = force,
  expectedSha256: string = SAS_PACKAGES_RELEASE_SHA256
): Promise<boolean> => {
  const cacheList = path.join(cacheFolder, path.basename(downloadCacheList))

  if (
    !(await cachedDownloadsAreCurrent(
      cacheFolder,
      cacheList,
      forced,
      expectedSha256
    ))
  )
    return false

  // `copySASjsCore` recreates the folder on a start, but this can also run on
  // its own - and a clean clone has no folder to copy into.
  await createFolder(folder)

  for (const name of await readList(cacheList)) {
    // The list is a local file, so a tampered one must not name a path that
    // leaves the folder; `cacheDownloads` only ever writes plain names.
    if (isUnsafeMacroName(name)) {
      console.warn(`Ignoring ${name}: not a macro file name`)

      continue
    }

    await fs.promises.copyFile(
      path.join(cacheFolder, name),
      path.join(folder, name)
    )
  }

  await writeInventory(folder, listPath)

  return true
}

/**
 * Copies a completed download into the cache, so the next start does not fetch
 * it again. The cache is rebuilt rather than merged, so a macro that upstream
 * no longer ships does not linger in it.
 */
export const cacheDownloads = async (
  names: string[],
  folder: string = sasJSCoreMacros,
  cacheFolder: string = downloadCache,
  expectedSha256: string = SAS_PACKAGES_RELEASE_SHA256
) => {
  await deleteFolder(cacheFolder)
  await createFolder(cacheFolder)

  for (const name of names) {
    await fs.promises.copyFile(
      path.join(folder, name),
      path.join(cacheFolder, name)
    )
  }

  await writeCacheManifest(cacheFolder, names, expectedSha256)
}

/** The macro names the cache records as downloaded, or none when it has no list. */
const previousDownloadNames = async (
  cacheFolder: string = downloadCache
): Promise<string[]> => {
  const listPath = path.join(cacheFolder, path.basename(downloadCacheList))

  return (await fileExists(listPath)) ? await readList(listPath) : []
}

/**
 * Removes the macros an earlier download installed that the release no longer
 * ships.
 *
 * A refresh extracts over the macros folder, and that folder also holds the
 * core macros `copySASjsCore` provides, so it cannot simply be emptied: the
 * cache's own list is the record of what the download put there, and only
 * those names are removed - and only when the new release does not carry them.
 * Without this a macro upstream deleted would be left in the folder and in its
 * inventory, and installed forever.
 */
export const removeStaleDownloads = async (
  folder: string,
  previous: string[],
  current: string[]
) => {
  const keep = new Set(current)

  for (const name of previous) {
    if (keep.has(name) || isUnsafeMacroName(name)) continue

    const stale = path.join(folder, name)

    if (await fileExists(stale)) await fs.promises.rm(stale)
  }
}

/** Knobs the spec redirects at a local stand-in for the archive host. */
export interface DownloadMacrosOptions {
  /** Where the release archive is fetched from. */
  archiveUrl?: string
  /** The SHA-256 the archive must match; defaults to the pinned release's. */
  expectedSha256?: string
  /** Seconds to wait before retrying; the default backs off linearly. */
  waitSeconds?: (attempt: number) => number
  /** Milliseconds one attempt may take; defaults to `downloadTimeoutMs`. */
  timeoutMs?: number
  /**
   * Install the newest upstream tag rather than the pin. Set by the release
   * workflow through `SASJS_SAS_PACKAGES_LATEST`; defaults to that.
   */
  resolveLatest?: boolean
  /** Where the tags come from; the spec replaces `git ls-remote`. */
  listTags?: () => Promise<string[]>
  /** Where a tag's blob hashes come from; the spec replaces the API call. */
  fetchTree?: (tag: string) => Promise<Record<string, string>>
  /** Where the resolved release is recorded; defaults to `resolvedReleaseFile`. */
  resolvedReleasePath?: string
}

/**
 * Fetches the release archive, retrying the failures worth retrying. The
 * request carries no Authorization header on purpose: a GITHUB_TOKEN is for
 * api.github.com, and forwarding it to another host would only leak it.
 */
const downloadArchive = async (
  url: string,
  waitSeconds: (attempt: number) => number,
  timeoutMs: number = downloadTimeoutMs
): Promise<Buffer> => {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {},
        timeout: timeoutMs
      })

      return Buffer.from(res.data)
    } catch (error) {
      if (!isRetryable(error) || attempt === attempts)
        throw new Error(
          `Failed to download the SAS_PACKAGES macros from ${url} after ${attempt} attempt(s): ${describe(
            error
          )}.`
        )

      const wait = waitSeconds(attempt)

      console.warn(`Download attempt ${attempt} failed; retrying in ${wait}s`)

      await new Promise((resolve) => setTimeout(resolve, wait * 1000))
    }
  }
}

/**
 * Reads the macros out of a release archive into the folder.
 *
 * Only entries under `SPF/Macros/` are ours: the rest of the archive (its
 * README, SPFinit.sas) is not installed. The prefix is anchored at the start of
 * the entry name, so a path that merely mentions the folder later on - a
 * documentation folder that itself contains `SPF/Macros` - is skipped rather
 * than installed under a name derived from the wrong segment. An entry that
 * reaches into the macros folder but does not name a plain file in it - a `..`
 * or `.` in the name, a subfolder, a backslash - is rejected outright rather
 * than skipped, because a well-formed release has none and writing anything
 * outside the folder is not an option. Every entry is validated before the first
 * file is written, so a bad archive leaves the folder untouched.
 */
const extractMacros = async (
  archive: Buffer,
  url: string
): Promise<{ name: string; content: Buffer }[]> => {
  let entries: AdmZip.IZipEntry[]

  try {
    entries = new AdmZip(archive).getEntries()
  } catch (error) {
    throw new Error(
      `Failed to download the SAS_PACKAGES macros from ${url}: the archive is not a valid zip: ${message(
        error
      )}.`
    )
  }

  const macros: { name: string; content: Buffer }[] = []

  for (const entry of entries) {
    if (entry.isDirectory) continue

    const entryName = entry.entryName

    if (!macrosFolderInArchive.test(entryName)) continue

    const name = macroFileName(entryName)

    if (!name || isUnsafeMacroName(name))
      throw new Error(
        `Failed to download the SAS_PACKAGES macros from ${url}: the archive names an unsafe path (${entryName}).`
      )

    // The bytes, not a decoded string: re-encoding a macro that is not valid
    // UTF-8 would install it with U+FFFD where the pinned archive had bytes,
    // and the archive checksum would prove nothing.
    macros.push({ name, content: entry.getData() })
  }

  if (!macros.length)
    throw new Error(
      `Failed to download the SAS_PACKAGES macros from ${url}: the archive contains no SPF/Macros files.`
    )

  // Returned, not written: a resolved release verifies every macro against the
  // tag's tree first, so a mismatch leaves the folder untouched.
  return macros
}

/**
 * The release's archive, its checksum verified when one is known, then the
 * SPF/Macros files extracted from it.
 *
 * Which release that is comes from `resolveRelease`: the pin by default, or the
 * newest upstream tag when the build asks for it.
 */
export const downloadMacros = async (
  folder: string = sasJSCoreMacros,
  cacheFolder: string = downloadCache,
  forced: boolean = force,
  {
    archiveUrl,
    expectedSha256,
    waitSeconds = (attempt: number) => attempt * 5,
    timeoutMs = downloadTimeoutMs,
    resolveLatest = latestRequested(),
    listTags,
    fetchTree,
    resolvedReleasePath = resolvedReleaseFile
  }: DownloadMacrosOptions = {}
) => {
  const release = await resolveRelease({ resolveLatest, listTags, fetchTree })
  const url = archiveUrl ?? sasPackagesArchiveUrl(release.tag)

  // A release build runs twice in one job - `prebuild` forces a download, then
  // `initial` installs from the cache it wrote - and the newest tag has no pin
  // to compare against, so the recorded checksum is what makes the second run a
  // cache hit rather than a second 13 MB fetch. It is only trusted for the tag
  // it was recorded for.
  const expected =
    expectedSha256 ??
    release.expectedSha256 ??
    (await recordedSha256(release.tag, resolvedReleasePath))

  if (
    expected &&
    (await installFromCache(
      folder,
      cacheFolder,
      path.join(folder, '.macrolist'),
      forced,
      expected
    ))
  ) {
    console.info(
      `Macros installed from ${cacheFolder}; skipping the download (npm run downloadMacros -- --force refreshes them)`
    )

    return
  }

  console.info(
    `Downloading macros from ${url} (${release.source === 'latest' ? `newest upstream release ${release.tag}` : `${release.source} release ${release.tag}`})`
  )

  // Written before the cache is rebuilt: after that the list describes the new
  // release, and the names the old one owned would be lost.
  const previous = await previousDownloadNames(cacheFolder)

  const archive = await downloadArchive(url, waitSeconds, timeoutMs)

  const actualSha256 = crypto.createHash('sha256').update(archive).digest('hex')

  if (expected && actualSha256 !== expected)
    throw new Error(
      `Failed to download the SAS_PACKAGES macros from ${url}: the archive's SHA-256 is ${actualSha256}, but ${release.tag} is ${expected}.`
    )

  const macros = await extractMacros(archive, url)

  // A resolved release has no archive checksum to compare against, so the bytes
  // are checked against the tag's own tree before anything is installed.
  if (release.tree) verifyAgainstTree(release.tag, macros, release.tree)

  // A clean clone has no `api/sas/sasautos` - it is gitignored and normally
  // created by `copySASjsCore` - and this script is documented as runnable on
  // its own, so the folder is made here rather than assumed.
  await createFolder(folder)

  for (const { name, content } of macros) {
    await fs.promises.writeFile(path.join(folder, name), content)
  }

  const names = macros.map((macro) => macro.name)

  await removeStaleDownloads(folder, previous, names)

  // After the cleanup, so the inventory describes what the download left and
  // not a macro the release dropped.
  await writeInventory(folder, path.join(folder, '.macrolist'))

  // The cache records the checksum that was actually installed, which for a
  // resolved release is the only pin there is.
  await cacheDownloads(names, folder, cacheFolder, actualSha256)

  await writeResolvedRelease(release, actualSha256, resolvedReleasePath)
}

// Run only when invoked as a script, so a spec can import the helpers above
// without starting a download.
if (require.main === module) downloadMacros()
