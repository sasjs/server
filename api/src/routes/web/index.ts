import express from 'express'
import { csrfProtection } from '../../app'
import webRouter from './web'

const router = express.Router()

router.use(csrfProtection)

router.use(function (req, res, next) {
  res.cookie('XSRF-TOKEN', req.csrfToken())
  next()
})

router.use('/', webRouter)

export default router
