import express from 'express'
import indexRouter from './routes'

const app = express()

app.use('/', indexRouter)

const port = 5000
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})
