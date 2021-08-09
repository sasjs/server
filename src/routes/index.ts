import express from 'express'
import { processSas, createFileTree, getTreeExample } from '../controllers'
import { ExecutionResult, isRequestQuery, isFileTree } from '../types'

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

router.post('/deploy', async (req, res) => {
  if (!isFileTree(req.body)) {
    res.status(400).send(getTreeExample())

    return
  }

  await createFileTree(req.body.members)
    .then(() => {
      res.status(200).send('Files deployed successfully to @sasjs/server.')
    })
    .catch((err) => {
      res.status(500).send({ message: 'Deployment failed!', ...err })
    })
})

router.post('/execute', async (req, res) => {
  if (req.body?._program) {
    const result: ExecutionResult = await processSas(req.body)

    res.status(200).send(result)
  } else {
    res.status(400).send(`Please provide the location of SAS code`)
  }
})

export default router
