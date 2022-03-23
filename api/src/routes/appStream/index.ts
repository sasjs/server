import path from 'path'
import express from 'express'
import { folderExists } from '@sasjs/utils'

import { addEntryToAppStreamConfig, getTmpFilesFolderPath } from '../../utils'
import { appStreamHtml } from './appStreamHtml'

const router = express.Router()

router.get('/', async (_, res) => {
  const content = appStreamHtml(process.appStreamConfig)

  return res.send(content)
})

export const publishAppStream = async (
  appLoc: string,
  streamWebFolder: string,
  streamServiceName?: string,
  streamLogo?: string,
  addEntryToFile: boolean = true
) => {
  const driveFilesPath = getTmpFilesFolderPath()

  const appLocParts = appLoc.replace(/^\//, '')?.split('/')
  const appLocPath = path.join(driveFilesPath, ...appLocParts)
  if (!appLocPath.includes(driveFilesPath)) {
    throw new Error('appLoc cannot be outside drive.')
  }

  const pathToDeployment = path.join(appLocPath, 'services', streamWebFolder)
  if (!pathToDeployment.includes(appLocPath)) {
    throw new Error('streamWebFolder cannot be outside appLoc.')
  }

  if (await folderExists(pathToDeployment)) {
    const appCount = process.appStreamConfig
      ? Object.keys(process.appStreamConfig).length
      : 0

    if (!streamServiceName) {
      streamServiceName = `AppStreamName${appCount + 1}`
    }

    router.use(`/${streamServiceName}`, express.static(pathToDeployment))

    addEntryToAppStreamConfig(
      streamServiceName,
      appLoc,
      streamWebFolder,
      streamLogo,
      addEntryToFile
    )

    const sasJsPort = process.env.PORT ?? 5000
    console.log(
      'Serving Stream App: ',
      `http://localhost:${sasJsPort}/AppStream/${streamServiceName}`
    )
    return { streamServiceName }
  }
  return {}
}

export default router
