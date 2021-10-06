import path from 'path'
import { readFileSync } from 'fs'
import * as https from 'https'

import app from './app'

const port = 5001
const keyPath = path.join('certificates', 'privkey.pem')
const certPath = path.join('certificates', 'fullchain.pem')

const key = readFileSync(keyPath)
const cert = readFileSync(certPath)

const httpsServer = https.createServer({ key, cert }, app)

httpsServer.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`)
})
