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

// SAS:
// https://sas.analytium.co.uk:8343/SASStoredProcess/do?_action=form,properties,execute,noba[…]blic%2Fapp%2Fdata-combiner%2Fservices%2Fcommon%2Fappinit
// https://sas.analytium.co.uk:8343/SASStoredProcess/
// https://sas.analytium.co.uk:8343/SASStoredProcess/do?&_program=%2FPublic%2Fapp%2Fdata-combiner%2Fservices%2Fcommon%2Fappinit&_DEBUG=131
// https://sas.analytium.co.uk:8343/SASStoredProcess/do?_program=%2FPublic%2Fapp%2Fdata-comb[…]ction=update%2Cnewwindow%2Cnobanner&_updatekey=895432774

// SASjs:
// http://localhost:5000/SASjsExecutor?_program=%2FPublic%2Fapp%2Fdata-combiner%2Fservices%2Fcommon%2Fappinit
// http://localhost:5000/SASjsExecutor
// http://localhost:5000/SASjsExecutor?_program=%2FPublic%2Fapp%2Fdata-combiner%2Fservices%2Fcommon%2Fappinit&_DEBUG=131

router.get('/SASjsExecutor/do', async (req, res) => {
  const queryEntries = Object.keys(req.query).map((entry: string) =>
    entry.toLowerCase()
  )
  const isDebug = queryEntries.find((entry: string) => entry === '_debug')
    ? true
    : false

  if (isRequestQuery(req.query)) {
    await processSas({ ...req.query, _debug: isDebug })
      .then((result) => {
        res.status(200).send(result)
      })
      .catch((err) => {
        res.status(400).send({
          status: 'failure',
          message: 'Job execution failed.',
          error: err
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
