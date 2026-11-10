import axios from 'axios'
import Downloader from 'nodejs-file-downloader'
import path from 'path'
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
import { githubApiHeaders } from '../src/utils/githubApi'

const listUrl =
  'https://api.github.com/repos/yabwon/SAS_PACKAGES/contents/SPF/Macros'

/**
 * Where the downloaded macros are kept between starts.
 *
 * Two directories must not contain it: `sasJSCoreMacros`, which `copySASjsCore`
 * deletes and recreates on every start, and `api/sas/`, which `sas:copy` copies
 * wholesale into the build - a cache there would be wiped each start, or ship a
 * second copy of the macros that nothing reads. It sits beside `sas/` instead,
 * and this folder is rebuilt only by the download, so it is the completion
 * marker for sasjs/server#312's skip.
 */
export const downloadCache = path.join(apiRoot, '.sasautos-download')
const downloadCacheList = path.join(downloadCache, '.macrolist')

/**
 * The file name a macro is stored under: the SAS_PACKAGES path is stripped, the
 * rest is the name.
 */
export const macroFileName = (pathInRepo: string): string =>
  pathInRepo.replace(/^SPF\/Macros\//, '')

/**
 * Refreshes the cache even when it looks current. Set by passing `--force` to
 * the script (`npm run downloadMacros -- --force`), which `prebuild` does so a
 * build never installs a stale snapshot.
 */
const force = process.argv.includes('--force')

/** Attempts for the listing; the per-file downloads are retried by Downloader. */
const attempts = 3

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
    return 'the GitHub API answered 504 (Gateway Time-out) - that is the forge, not this build'

  if (status === 403 || status === 429)
    return `the GitHub API refused the request with ${status}; it rate limits unauthenticated requests per source IP, so set GITHUB_TOKEN to authenticate it`

  return error instanceof Error ? error.message : String(error)
}

/** The macro names a list file records, one per line. */
const readList = async (listPath: string): Promise<string[]> =>
  (await readFile(listPath))
    .split('\n')
    .map((name) => name.trim())
    .filter(Boolean)

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
 * The cache list is written once every file has been copied into the cache, and
 * names them. A list whose files are all present means the cache is intact, so
 * the listing and downloads can be skipped - the point of sasjs/server#312,
 * where every `npm start` in development re-downloaded all of them.
 *
 * The list is written last, so a cache that was only half populated names a
 * file that is missing (or has no list at all), and this answers `false`:
 * `downloadMacros` fetches instead of installing a partial tree. `forced` is
 * the deliberate refresh - `--force` on the script - and answers `false`
 * regardless.
 */
export const cachedDownloadsAreCurrent = async (
  cacheFolder: string = downloadCache,
  listPath: string = downloadCacheList,
  forced: boolean = force
): Promise<boolean> => {
  if (forced) return false
  if (!(await fileExists(listPath))) return false

  const names = await readList(listPath)

  if (!names.length) return false

  for (const name of names) {
    if (!(await fileExists(path.join(cacheFolder, name)))) return false
  }

  return true
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
  forced: boolean = force
): Promise<boolean> => {
  const cacheList = path.join(cacheFolder, path.basename(downloadCacheList))

  if (!(await cachedDownloadsAreCurrent(cacheFolder, cacheList, forced)))
    return false

  for (const name of await readList(cacheList)) {
    await createFile(
      path.join(folder, name),
      await readFile(path.join(cacheFolder, name))
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
  cacheFolder: string = downloadCache
) => {
  await deleteFolder(cacheFolder)
  await createFolder(cacheFolder)

  for (const name of names) {
    await createFile(
      path.join(cacheFolder, name),
      await readFile(path.join(folder, name))
    )
  }

  await createFile(path.join(cacheFolder, '.macrolist'), names.join('\n'))
}

/**
 * The listing, retried; then the files it names.
 *
 * The two phases are reported apart on purpose: a failure to LIST and a failure
 * to download one named macro are different problems, and the second one is not
 * a rate limit whatever the first one's message says.
 */
export const downloadMacros = async (
  folder: string = sasJSCoreMacros,
  cacheFolder: string = downloadCache,
  forced: boolean = force
) => {
  if (
    await installFromCache(
      folder,
      cacheFolder,
      path.join(folder, '.macrolist'),
      forced
    )
  ) {
    console.info(
      `Macros installed from ${cacheFolder}; skipping the download (npm run downloadMacros -- --force refreshes them)`
    )

    return
  }

  console.info(`Downloading macros from ${listUrl}`)

  let files: unknown[] = []

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await axios.get(listUrl, { headers: githubApiHeaders() })

      files = res.data

      break
    } catch (error) {
      const reached = attempt

      if (!isRetryable(error) || attempt === attempts)
        throw new Error(
          `Failed to list the SAS_PACKAGES macros at ${listUrl} after ${reached} attempt(s): ${describe(
            error
          )}.`
        )

      const wait = attempt * 5

      console.warn(`Listing attempt ${attempt} failed; retrying in ${wait}s`)

      await new Promise((resolve) => setTimeout(resolve, wait * 1000))
    }
  }

  const names = await downloadFiles(files, folder)

  await cacheDownloads(names, folder, cacheFolder)
}

const downloadFiles = async function (
  fileList: any[],
  folder: string = sasJSCoreMacros
): Promise<string[]> {
  const names: string[] = []

  for (const file of fileList) {
    const fileName = macroFileName(file.path)

    const downloader = new Downloader({
      url: file.download_url,
      directory: folder,
      fileName,
      cloneFiles: false
    })

    try {
      await downloader.download()
    } catch (error) {
      throw new Error(
        `Failed to download the SAS macro ${file.path} from ${file.download_url}: ${
          error instanceof Error ? error.message : String(error)
        }.`
      )
    }

    names.push(fileName)
  }

  await writeInventory(folder, path.join(folder, '.macrolist'))

  return names
}

// Run only when invoked as a script, so a spec can import the helpers above
// without starting a download.
if (require.main === module) downloadMacros()
