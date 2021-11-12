import appPromise from './app'
import { configuration } from '../package.json'

appPromise.then((app) => {
  app.listen(configuration.sasJsPort, () => {
    console.log(
      `⚡️[server]: Server is running at http://localhost:${configuration.sasJsPort}`
    )
  })
})
