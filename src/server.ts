import app from './app'

const port = 5000
const listener = app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})
