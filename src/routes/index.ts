import express from 'express'
import { processSas, createFileTree, getTreeExample } from '../controllers'
import { ExecutionResult, isRequestQuery, isFileTree } from '../types'
import { makeFilesNamesMap } from '../utils'

const multer  = require('multer')
const upload = multer({ dest: 'sas_uploads/' })
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

// TODO: respond with HTML page including file tree
router.get('/SASjsExecutor', async (req, res) => {
  res.status(200).send({ status: 'success', tree: {} })
})

router.post('/SASjsExecutor/do', upload.array('files', 10), async (req: any, res) => {
  const queryEntries = Object.keys(req.query).map((entry: string) =>
    entry.toLowerCase()
  )

  if (isRequestQuery(req.query)) {
    const filesNamesMap = makeFilesNamesMap(req.files)

    await processSas({ ...req.query }, {filesNamesMap})
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
