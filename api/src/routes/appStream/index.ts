import path from 'path'
import express from 'express'

import { getTmpFilesFolderPath } from '../../utils'

const router = express.Router()

export const publishAppStream = (appLoc: string[]) => {
  const appLocUrl = encodeURI(appLoc.join('/'))
  const appLocPath = appLoc.join(path.sep)

  const pathToDeployment = path.join(
    getTmpFilesFolderPath(),
    appLocPath,
    'services',
    'webv'
  )

  router.use(`/${appLocUrl}`, express.static(pathToDeployment))
}

export default router
