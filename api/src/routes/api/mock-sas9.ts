import { readFile } from '@sasjs/utils'
import express, { Request } from 'express'
import path from 'path'

const mockSas9Router = express.Router()

const { MOCK_SERVERTYPE } = process.env

mockSas9Router.post('/SASStoredProcess/do/', async (req, res) => {
  let program = req.query._program?.toString() || ''
  program = program.replace('/', '')
  const filePath = path.join(process.cwd(), 'mocks', program)
  
  let file

  try {
    file = await readFile(
      filePath
    )
  } catch (err: any) {
    console.error(`Mocked file on path: ${filePath} is not found.`)

    return
  }

  if (!file) {
    console.error(`Mocked file on path: ${filePath} is not found.`)
    return
  }

  let fileContent = ''

  try {
    fileContent = JSON.parse(file)
  } catch (err: any) {
    fileContent = file
  }

  try {
    res.send(fileContent)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

if (MOCK_SERVERTYPE === undefined) {
  mockSas9Router.post('/SASLogon/login', async (req, res) => {
    try {
      res.send({ msg: 'Login' })
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  })

}

export default mockSas9Router
