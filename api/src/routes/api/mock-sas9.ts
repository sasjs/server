import { readFile } from '@sasjs/utils'
import express from 'express'
import path from 'path'

const mockSas9Router = express.Router()

const { MOCK_SERVERTYPE } = process.env

let loggedIn: boolean = false

mockSas9Router.get('/SASStoredProcess', async (req, res) => {
  if (!loggedIn) {
    res.redirect('/SASLogon/login')
    return
  }

  const filePath = path.join(process.cwd(), 'mocks',  "generic", "sas9", "sas-stored-process")

  let file

  try {
    file = await readFile(
      filePath
    )
  } catch (err: any) {
    console.error(`Mocked file on path: ${filePath} is not found.`)
    res.status(403).send(err.toString())
    return
  }

  try {
    res.send(file)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

mockSas9Router.post('/SASStoredProcess/do/', async (req, res) => {
  let program = req.query._program?.toString() || ''
  program = program.replace('/', '')
  const filePath = path.join(process.cwd(), 'mocks', ...program.split('/'))
  
  let file

  try {
    file = await readFile(
      filePath
    )
  } catch (err: any) {
    let err = `Mocked file on path: ${filePath} is not found.`
    console.error(err)
    res.status(403).send(err)
    return
  }

  if (!file) {
    let err = `Mocked file on path: ${filePath} is not found.`
    console.error(err)
    res.status(403).send(err)
    return
  }

  if (!loggedIn) {
    res.redirect('/SASLogon/login')
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

if (MOCK_SERVERTYPE !== undefined) {
  mockSas9Router.get('/SASLogon/login', async (req, res) => {
    const filePath = path.join(process.cwd(), 'mocks', 'generic', 'sas9', 'login')

    try {
      const file = await readFile(
        filePath
      )

      res.send(file)
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  })

  mockSas9Router.post('/SASLogon/login', async (req, res) => {
    loggedIn = true

    const filePath = path.join(process.cwd(), 'mocks', 'generic', 'sas9', 'logged-in')

    try {
      const file = await readFile(
        filePath
      )

      res.send(file)
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  })

  mockSas9Router.get('/SASLogon/logout', async (req, res) => {
    loggedIn = false

    const filePath = path.join(process.cwd(), 'mocks', 'generic', 'sas9', 'logged-out')

    try {
      const file = await readFile(
        filePath
      )

      res.send(file)
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  })
}

export default mockSas9Router
