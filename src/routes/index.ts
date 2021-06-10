import express from 'express'
import { processSas } from '../controllers'
import { ExecutionResult, RequestQuery, isRequestQuery } from '../types'

const router = express.Router()

router.get('/', async (req, res) => {
  const query = req.query

  if (!isRequestQuery(query)) {
    res.send('Welcome to @sasjs/server API')

    return
  }

  const result: ExecutionResult = await processSas(query)

  res.send(`<b>Executed!</b><br>
<p>Log is located:</p> ${result.logPath}<br>
<p>Log:</p> <textarea style="width: 100%; height: 100%">${result.log}</textarea>`)
})

export default router
