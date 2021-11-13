import open from 'open'
import appPromise from './app'
import { configuration } from '../package.json'

appPromise.then((app) => {
  app.listen(configuration.sasJsPort, () => {
    console.log(
      `⚡️[server]: Server is running at http://localhost:${configuration.sasJsPort}`
    )
    const { MODE } = process.env
    if (MODE?.trim() !== 'server') {
      open(`http://localhost:${configuration.sasJsPort}`)
    }
  })
})
