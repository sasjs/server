import express from 'express'
import { processSas, createFileTree, getTreeExample } from '../controllers'
import { ExecutionResult, isRequestQuery, isFileTree } from '../types'
import { makeFilesNamesMap } from '../utils'
import fs from 'fs'
import path from 'path'
import { uuidv4 } from '@sasjs/utils'
import { configuration } from '../../package.json'

const sasUploadPath =
  configuration.sasUploadsPath.charAt(0) === '/'
    ? configuration.sasUploadsPath.replace('/', '')
    : configuration.sasUploadsPath

//initializing multer for files intercepting
const multer = require('multer')
const router = express.Router()

var storage = multer.diskStorage({
  destination: function (req: any, file: any, cb: any) {
    //if not already existing, creating subfolder for current request files
    const uploadsPath = path.join(__dirname, `../../${sasUploadPath}`)
    const reqFolderPath = `${uploadsPath}/${req.sasUploadFolder}`

    //Sending the intercepted files to the desired subfolder
    cb(null, `${sasUploadPath}/${req.sasUploadFolder}`)
  }
})

const upload = multer({ storage: storage })

//It will intercept request and generate uniqe uuid to be used as a subfolder name
//that will store the files uploaded
const preuploadMiddleware = (req: any, res: any, next: any) => {
  req.sasUploadFolder = uuidv4()

  const uploadsPath = path.join(__dirname, `../../${sasUploadPath}`)
  const reqFolderPath = `${uploadsPath}/${req.sasUploadFolder}`

  if (!fs.existsSync(reqFolderPath)) fs.mkdirSync(reqFolderPath)

  next()
}

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

router.get('/SASjsExecutor/do', preuploadMiddleware, async (req: any, res) => {
  console.log('req.query', req.query)
  console.log('req.body', req.body)
  const queryEntries = Object.keys(req.query).map((entry: string) =>
    entry.toLowerCase()
  )

  if (isRequestQuery(req.query)) {
    await processSas({ ...req.query }, { sasSessionTmp: req.sasUploadFolder })
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

router.post(
  '/SASjsExecutor/do',
  preuploadMiddleware,
  upload.any(),
  async (req: any, res) => {
    const queryEntries = Object.keys(req.query).map((entry: string) =>
      entry.toLowerCase()
    )

    if (isRequestQuery(req.query)) {
      let filesNamesMap = null

      if (req.files && req.files.length > 0) {
        filesNamesMap = makeFilesNamesMap(req.files)
      }

      await processSas(
        { ...req.query },
        {
          filesNamesMap: filesNamesMap ? filesNamesMap : undefined,
          sasSessionTmp: req.sasUploadFolder
        }
      )
        .then((result) => {
          console.log('result')
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
  }
)

export default router
