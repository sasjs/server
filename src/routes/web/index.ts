import express from 'express'
import webRouter from './web'

const router = express.Router()

router.use('/web', webRouter)

export default router
