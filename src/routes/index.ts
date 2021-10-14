import express from 'express'
import path from 'path'
import {
  processSas,
  createFileTree,
  getTreeExample,
  sasjsExecutor,
  sasjsDrive
} from '../controllers'
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
  if (!isFileTree({ members: req.body.members })) {
    res.status(400).send({
      status: 'failure',
      message: 'Provided not supported data format.',
      example: getTreeExample()
    })

    return
  }

  await createFileTree(
    req.body.members,
    req.body.appLoc ? req.body.appLoc.replace(/^\//, '').split('/') : []
  )
    .then(() => {
      res.status(200).send({
        status: 'success',
        message: 'Files deployed successfully to @sasjs/server.'
      })
    })
    .catch((err) => {
      res
        .status(500)
        .send({ status: 'failure', message: 'Deployment failed!', ...err })
    })
})

router.get('/SASjsDrive', async (req, res) => {
  if (req.query.filepath) {
    const fileContent = await sasjsDrive(req.query.filepath as string, 'read')
    res.status(200).send({ status: 'success', fileContent: fileContent })
  } else {
    res.sendFile(path.join(__dirname, '..', '..', 'Web', 'build', 'index.html'))
  }
})

router.post('/SASjsDrive', async (req, res) => {
  await sasjsDrive(req.body.filePath as string, 'update', req.body.fileContent)
  res.status(200).send({ status: 'success' })
})

router.get('/SASjsExecutor', async (req, res) => {
  const tree = sasjsExecutor()
  res.status(200).send({ status: 'success', tree })
})

router.get('/SASjsExecutor/do', async (req, res) => {
  const queryEntries = Object.keys(req.query).map((entry: string) =>
    entry.toLowerCase()
  )

  if (isRequestQuery(req.query)) {
    await processSas({ ...req.query })
      .then((result) => {
        res.status(200).send(result)
      })
      .catch((err) => {
        res.status(400).send({
          status: 'failure',
          message: 'Job execution failed.',
          ...err
        })
      })
  } else {
    res.status(400).send({
      status: 'failure',
      message: `Please provide the location of SAS code`
    })
  }
})

export default router
