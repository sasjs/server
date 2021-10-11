import express from 'express'
import indexRouter from './routes'
import fs from 'fs'
import { configuration } from '../package.json'
import path from 'path'

const sasUploadPath = configuration.sasUploadsPath.charAt(0) === '/' ? configuration.sasUploadsPath.replace('/', '') : configuration.sasUploadsPath

const app = express()

app.use(express.json({ limit: '50mb' }))

app.use('/', indexRouter)

if (sasUploadPath.length > 0 && !fs.existsSync(`./${sasUploadPath}`)) {
    fs.mkdirSync(`./${sasUploadPath}`)
}

export default app
