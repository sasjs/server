import appPromise from './app'

appPromise.then((app) => {
  const sasJsPort = process.env.PORT ?? 5000
  app.listen(sasJsPort, () => {
    console.log(
      `⚡️[server]: Server is running at http://localhost:${sasJsPort}`
    )
  })
})
