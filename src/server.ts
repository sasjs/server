import app from './app'
import { configuration } from '../package.json'

app.listen(configuration.sasJsPort, () => {
  console.log(
    `⚡️[server]: Server is running at http://localhost:${configuration.sasJsPort}`
  )
})
