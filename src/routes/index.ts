import express from 'express'
import { processSas, createFileTree, getTreeExample } from '../controllers'
import {
  ExecutionResult,
  isRequestQuery,
  isFileTree,
  AuthMechanism
} from '../types'
import { getAuthMechanisms } from '../utils'

const router = express.Router()

const header = (user: any) => {
  const authMechanisms = getAuthMechanisms()
  if (
    authMechanisms.length === 1 &&
    authMechanisms[0] === AuthMechanism.NoSecurity
  )
    return '<div><p>No Security applied</p></div>'
  return `<div><p>Logged in as ${user.username} <a href="/signout" role="button">Logout</a></p></div>`
}
router.get('/', async (req, res) => {
  const query = req.query

  if (!isRequestQuery(query)) {
    res.send(`${header(req.user)}Welcome to @sasjs/server API`)

    return
  }

  const result: ExecutionResult = await processSas(query)

  res.send(`${header(req.user)}<b>Executed!</b><br>
<p>Log is located:</p> ${result.logPath}<br>
<p>Log:</p> <textarea style="width: 100%; height: 100%">${
    result.log
  }</textarea>`)
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
export * from './routes'
