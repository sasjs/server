import express from 'express'
import { createFileTree, getSessionController, getTreeExample } from '../controllers'
import { ExecutionResult, isRequestQuery, isFileTree } from '../types'
import path from 'path'
import { getTmpFilesFolderPath, getTmpFolderPath, makeFilesNamesMap } from '../utils'
import { ExecutionController } from '../controllers'
import { uuidv4 } from '@sasjs/utils'

const multer = require('multer')
const router = express.Router()

const storage = multer.diskStorage({
  destination: function (req: any, file: any, cb: any) {
    //Sending the intercepted files to the sessions subfolder
    cb(null, req.sasSession.path)
  },
  filename: function (req: any, file: any, cb: any) {
    //req_file prefix + unique hash added to sas request files
    cb(null, `req_file_${uuidv4().replace(/-/gm, '')}`)
  }
})

const upload = multer({ storage: storage })

//It will intercept request and generate uniqe uuid to be used as a subfolder name
//that will store the files uploaded
const preuploadMiddleware = async (req: any, res: any, next: any) => {
  let session

  const sessionController = getSessionController()
  session = await sessionController.getSession()
  session.inUse = true
  
  req.sasSession = session

  next()
}

router.get('/', async (_, res) => {
  res.status(200).send('Welcome to @sasjs/server API')
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
  if (isRequestQuery(req.query)) {
    let sasCodePath = path
      .join(getTmpFilesFolderPath(), req.query._program)
      .replace(new RegExp('/', 'g'), path.sep)
      
    // If no extension provided, add .sas extension
    sasCodePath += !sasCodePath.includes('.') ? '.sas' : ''

    await new ExecutionController()
      .execute(sasCodePath, undefined, undefined, { ...req.query })
      .then((result: {}) => {
        res.status(200).send(result)
      })
      .catch((err: {} | string) => {
        res.status(400).send({
          status: 'failure',
          message: 'Job execution failed.',
          ...(typeof err === 'object' ? err : { details: err })
        })
      })
  } else {
    res.status(400).send({
      status: 'failure',
      message: `Please provide the location of SAS code`
    })
  }
})

router.post('/SASjsExecutor/do', preuploadMiddleware, upload.any(), async (req: any, res: any) => {
  if (isRequestQuery(req.query)) {
    let sasCodePath = path
      .join(getTmpFilesFolderPath(), req.query._program)
      .replace(new RegExp('/', 'g'), path.sep)

    // If no extension provided, add .sas extension
    sasCodePath += !sasCodePath.includes('.') ? '.sas' : ''

    let filesNamesMap = null

    if (req.files && req.files.length > 0) {
      filesNamesMap = makeFilesNamesMap(req.files)
    }

    await new ExecutionController()
      .execute(sasCodePath, undefined, req.sasSession, { ...req.query }, { filesNamesMap: filesNamesMap })
      .then((result: {}) => {
        res.status(200).send(result)
      })
      .catch((err: {} | string) => {
        res.status(400).send({
          status: 'failure',
          message: 'Job execution failed.',
          ...(typeof err === 'object' ? err : { details: err })
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
