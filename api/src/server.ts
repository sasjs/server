import path from 'path'
import { createServer } from 'https'
import { readFile } from '@sasjs/utils'

import appPromise from './app'

appPromise.then(async (app) => {
  const protocol = process.env.PROTOCOL ?? 'http'
  const sasJsPort = process.env.PORT ?? 5000

  if (protocol !== 'https') {
    app.listen(sasJsPort, () => {
      console.log(
        `⚡️[server]: Server is running at http://localhost:${sasJsPort}`
      )
    })
  } else {
    const { key, cert } = await getCertificates()

    const httpsServer = createServer({ key, cert }, app)
    httpsServer.listen(sasJsPort, () => {
      console.log(
        `⚡️[server]: Server is running at https://localhost:${sasJsPort}`
      )
    })
  }
})

const getCertificates = async () => {
  const privkey = process.env.PRIVATE_KEY ?? 'privkey.pem'
  const fullchain = process.env.FULL_CHAIN ?? 'fullchain.pem'

  const keyPath = path.join(process.cwd(), privkey)
  const certPath = path.join(process.cwd(), fullchain)

  const key = await readFile(keyPath)
  const cert = await readFile(certPath)

  return { key, cert }
}
