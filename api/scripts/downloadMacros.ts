import axios from 'axios'
import Downloader from 'nodejs-file-downloader'
import { createFile, listFilesInFolder } from '@sasjs/utils'

import { sasJSCoreMacros, sasJSCoreMacrosInfo } from '../src/utils/file'

export const downloadMacros = async () => {
  const url =
    'https://api.github.com/repos/yabwon/SAS_PACKAGES/contents/SPF/Macros'

  console.info(`Downloading macros from ${url}`)

  await axios
    .get(url)
    .then(async (res) => {
      await downloadFiles(res.data)
    })
    .catch((err) => {
      throw new Error(err)
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
