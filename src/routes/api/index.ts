import express from 'express'
import dotenv from 'dotenv'
import swaggerUi from 'swagger-ui-express'

import { authenticateAccessToken, verifyAdmin } from '../../middlewares'

import driveRouter from './drive'
import stpRouter from './stp'
import userRouter from './user'
import groupRouter from './group'
import clientRouter from './client'
import authRouter, { connectDB } from './auth'

dotenv.config()
connectDB()

const router = express.Router()

router.use('/drive', authenticateAccessToken, driveRouter)
router.use('/stp', authenticateAccessToken, stpRouter)
router.use('/user', userRouter)
router.use('/group', groupRouter)
router.use('/client', authenticateAccessToken, verifyAdmin, clientRouter)
router.use('/auth', authRouter)
router.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerOptions: {
      url: '/swagger.yaml'
    }
  })
)

export default router
