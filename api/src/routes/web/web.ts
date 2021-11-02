import express from 'express'
import { isExecutionQuery } from '../../types'
import path from 'path'
import { getTmpFilesFolderPath, getWebBuildFolderPath } from '../../utils'
import { ExecutionController } from '../../controllers'

const webRouter = express.Router()

webRouter.get('/', async (_, res) => {
  res.sendFile(path.join(getWebBuildFolderPath(), 'index.html'))
})

export default webRouter
