import express from 'express'
import dotenv from 'dotenv'

import driveRouter from './drive'
import stpRouter from './stp'
import userRouter from './user'
import clientRouter from './client'
import authRouter, { connectDB } from './auth'
import { authenticateAccessToken } from '../../utils'

dotenv.config()
connectDB()

const router = express.Router()

router.use('/drive', authenticateAccessToken, driveRouter)
router.use('/stp', authenticateAccessToken, stpRouter)
router.use('/user', authenticateAccessToken, verifyAdmin, userRouter)
router.use('/client', authenticateAccessToken, verifyAdmin, clientRouter)
router.use('/auth', authRouter)

function verifyAdmin(req: any, res: any, next: any) {
  const { user } = req
  if (!user?.isAdmin) return res.status(403).send('Admin account required')
  next()
}

export default router
