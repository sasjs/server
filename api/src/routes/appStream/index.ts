import path from 'path'
import express from 'express'
import { folderExists } from '@sasjs/utils'

import { getTmpFilesFolderPath } from '../../utils'

const router = express.Router()

export const publishAppStream = async (appLoc: string[]) => {
  const appLocUrl = encodeURI(appLoc.join('/'))
  const appLocPath = appLoc.join(path.sep)

  const pathToDeployment = path.join(
    getTmpFilesFolderPath(),
    appLocPath,
    'services',
    'webv'
  )

  if (await folderExists(pathToDeployment)) {
    router.use(`/${appLocUrl}`, express.static(pathToDeployment))
    console.log('Serving Stream App: ', appLocUrl)
  }
}

export default router
