import { readFile } from '@sasjs/utils'
import express from 'express'
import path from 'path'
import { MockSas9Controller } from '../../controllers/mock-sas9'

const mockSas9Router = express.Router()

const { MOCK_SERVERTYPE } = process.env

// Mock controller must be singleton because it keeps the states
// for example `isLoggedIn` and potentially more in future mocks
const mockSas9Controller = new MockSas9Controller()

mockSas9Router.get('/SASStoredProcess', async (req, res) => {
  const response = await mockSas9Controller.sasStoredProcess()

  if (response.redirect) {
    res.redirect(response.redirect)
    return
  }

  try {
    res.send(response.content)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

mockSas9Router.post('/SASStoredProcess/do/', async (req, res) => {
  const response = await mockSas9Controller.sasStoredProcessDo(req)

  if (response.redirect) {
    res.redirect(response.redirect)
    return
  }

  try {
    res.send(response.content)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

if (MOCK_SERVERTYPE !== undefined) {
  mockSas9Router.get('/SASLogon/login', async (req, res) => {
    const response = await mockSas9Controller.loginGet()

    try {
      res.send(response.content)
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  })

  mockSas9Router.post('/SASLogon/login', async (req, res) => {
    const response = await mockSas9Controller.loginPost()

    try {
      res.send(response.content)
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  })

  mockSas9Router.get('/SASLogon/logout', async (req, res) => {
    const response = await mockSas9Controller.logout()

    try {
      res.send(response.content)
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  })
}

export default mockSas9Router
