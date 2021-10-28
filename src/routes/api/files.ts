import express from 'express'
import { createFileTree, getTreeExample } from '../../controllers'
import { isFileTree } from '../../types'

const filesRouter = express.Router()

filesRouter.post('/deploy', async (req, res) => {
  if (!isFileTree(req.body.fileTree)) {
    res.status(400).send({
      status: 'failure',
      message: 'Provided not supported data format.',
      example: getTreeExample()
    })

    return
  }

  await createFileTree(
    req.body.fileTree.members,
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

export default filesRouter
