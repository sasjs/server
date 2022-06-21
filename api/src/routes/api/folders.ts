import express from 'express'
import { verifyHeaders } from '../../middlewares'
import { verifyQuery, setHeaders } from '../../utils'
import { FolderController } from '../../controllers'

const foldersRouter = express.Router()
const controller = new FolderController()

// https://sas.analytium.co.uk/folders/folders?parentFolderUri=/folders/folders/9e442a90-2c5b-40bb-982a-5fe3ff8a66b7
foldersRouter.post('/folders', verifyHeaders, async (req, res) => {
  console.log(`🤖[req.query]🤖`, req.query)
  console.log(`🤖[req.body]🤖`, req.body)

  try {
    const response = await controller.createFolder({
      ...req.query,
      ...req.body
    })

    console.log(`🤖[response]🤖`, response)

    res.send(response)
  } catch (err: any) {
    console.log(`🤖[error]🤖`, err)

    res.status(403).send(err.toString())
  }
})

foldersRouter.get('/folders/@item', verifyHeaders, async (req, res) => {
  const queryParam = 'path'

  try {
    const response = await controller.getItem({
      ...req.query,
      ...req.body
    })

    console.log(`🤖[response]🤖`, response)

    res.send(response)
  } catch (err: any) {
    console.log(`🤖[error]🤖`, err)

    res.status(403).send(err.toString())
  }

  // if (verifyQuery(req, res, [queryParam])) {
  //   const folderExist = Math.random() > 0.5

  //   setHeaders(res, folderExist)

  //   if (folderExist) {
  //     res.status(200).json({ message: 'Folder exists!' })
  //   } else {
  //     res.status(404).json({
  //       errorCode: 11512,
  //       message: 'No folders match the search criteria.',
  //       details: [`${queryParam}: ${req.query[queryParam]}`],
  //       links: [],
  //       version: 2
  //     })
  //   }
  // }
})

export default foldersRouter
