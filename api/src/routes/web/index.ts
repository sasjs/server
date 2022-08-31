import express from 'express'
import sas9WebRouter from './sas9-web'
import sasViyaWebRouter from './sasviya-web'
import webRouter from './web'

const router = express.Router()

const { MOCK_SERVERTYPE } = process.env

console.log('MOCK_SERVERTYPE', MOCK_SERVERTYPE)

switch (MOCK_SERVERTYPE?.toUpperCase()) {
  case 'SAS9': {
    router.use('/', sas9WebRouter)
    break
  }
  case 'SASVIYA': {
    router.use('/', sasViyaWebRouter)
    break
  }
  default: {
    router.use('/', webRouter)
  }
}

export default router
