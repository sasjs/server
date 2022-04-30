import express from 'express'
import { csrfProtection } from '../../app'
import webRouter from './web'

const router = express.Router()

router.use(csrfProtection)

router.use('/', webRouter)

export default router
