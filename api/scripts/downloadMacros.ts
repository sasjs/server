import axios from 'axios'
import Downloader from 'nodejs-file-downloader'
import { createFile, listFilesInFolder } from '@sasjs/utils'

import { sasJSCoreMacros, sasJSCoreMacrosInfo } from '../src/utils/file'
import { githubApiHeaders } from '../src/utils/githubApi'

const listUrl =
  'https://api.github.com/repos/yabwon/SAS_PACKAGES/contents/SPF/Macros'

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

export const downloadMacros = async () => {
  console.info(`Downloading macros from ${listUrl}`)

  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await axios.get(listUrl, { headers: githubApiHeaders() })

      await downloadFiles(res.data)

      return
    } catch (error) {
      lastError = error

      if (!isRetryable(error) || attempt === attempts) break

      const wait = attempt * 5

      console.warn(`Listing attempt ${attempt} failed; retrying in ${wait}s`)

      await new Promise((resolve) => setTimeout(resolve, wait * 1000))
    }
  }

  throw new Error(
    `Failed to list the SAS_PACKAGES macros at ${listUrl} after ${attempts} attempt(s): ${describe(
      lastError
    )}.`
  )
}

const downloadFiles = async function (fileList: any) {
  for (const file of fileList) {
    const downloader = new Downloader({
      url: file.download_url,
      directory: sasJSCoreMacros,
      fileName: file.path.replace(/^SPF\/Macros/, ''),
      cloneFiles: false
    })
    await downloader.download()
  }

  const fileNames = await listFilesInFolder(sasJSCoreMacros)

  await createFile(sasJSCoreMacrosInfo, fileNames.join('\n'))
}

downloadMacros()
