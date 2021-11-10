import express from 'express'
import path from 'path'
import { getWebBuildFolderPath } from '../../utils'

const webRouter = express.Router()

webRouter.get('/', async (_, res) => {
  res.sendFile(path.join(getWebBuildFolderPath(), 'index.html'))
})

export default webRouter
