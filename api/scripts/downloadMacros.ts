import axios from 'axios'
import Downloader from 'nodejs-file-downloader'
import { createFile, listFilesInFolder } from '@sasjs/utils'

import { sasJSCoreMacros, sasJSCoreMacrosInfo } from '../src/utils/file'
import { githubApiHeaders } from '../src/utils/githubApi'

export const downloadMacros = async () => {
  const url =
    'https://api.github.com/repos/yabwon/SAS_PACKAGES/contents/SPF/Macros'

  console.info(`Downloading macros from ${url}`)

  await axios
    .get(url, { headers: githubApiHeaders() })
    .then(async (res) => {
      await downloadFiles(res.data)
    })
    .catch((err) => {
      // The listing call is the one that hits api.github.com's per-IP rate
      // limit, which a shared CI address exhausts - so name the remedy rather
      // than leaving a bare 403 in the build log.
      throw new Error(
        `Failed to list the SAS_PACKAGES macros at ${url}: ${
          err instanceof Error ? err.message : String(err)
        }. The GitHub API rate limits unauthenticated requests per source IP; set GITHUB_TOKEN to authenticate the request.`
      )
    })
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
