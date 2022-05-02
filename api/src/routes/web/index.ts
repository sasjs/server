import express from 'express'
import webRouter from './web'

const router = express.Router()

router.use('/', webRouter)

export default router
