import express from 'express'
import sas9WebRouter from './sas9-web'
import sasViyaWebRouter from './sasviya-web'
import webRouter from './web'
import { MOCK_SERVERTYPEType } from '../../utils'

const router = express.Router()

const { MOCK_SERVERTYPE } = process.env

switch (MOCK_SERVERTYPE) {
  case MOCK_SERVERTYPEType.SAS9: {
    router.use('/', sas9WebRouter)
    break
  }
  case MOCK_SERVERTYPEType.SASVIYA: {
    router.use('/', sasViyaWebRouter)
    break
  }
  default: {
    router.use('/', webRouter)
  }
}

export default router
