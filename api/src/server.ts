import { createServer } from 'https'

import appPromise from './app'
import { getCertificates } from './utils'

appPromise.then(async (app) => {
  const protocol = process.env.PROTOCOL || 'http'
  const sasJsPort = process.env.PORT || 5000

  console.log('PROTOCOL: ', protocol)

  if (protocol !== 'https') {
    app.listen(sasJsPort, () => {
      console.log(
        `⚡️[server]: Server is running at http://localhost:${sasJsPort}`
      )
    })
  } else {
    const { key, cert, ca } = await getCertificates()

    const httpsServer = createServer({ key, cert, ca }, app)
    httpsServer.listen(sasJsPort, () => {
      console.log(
        `⚡️[server]: Server is running at https://localhost:${sasJsPort}`
      )
    })
  }
})
