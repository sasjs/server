// Express App Setup
import express from 'express'
import bodyParser from 'body-parser'

const app = express()

app.use(bodyParser.json())

// Express route handlers
app.get('/', (req, res) => {
  res.send('Hey from @sasjs/server API!')
})

const port = 5000
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`)
})
