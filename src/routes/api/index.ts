import express from 'express'
import dotenv from 'dotenv'

import driveRouter from './drive'
import stpRouter from './stp'
import userRouter from './user'
import clientRouter from './client'
import authRouter, { connectDB } from './auth'
import { authenticateToken } from '../../utils'

dotenv.config()
connectDB()

const router = express.Router()

router.use('/drive', authenticateToken, driveRouter)
router.use('/stp', authenticateToken, stpRouter)
router.use('/user', authenticateToken, verifyAdmin, userRouter)
router.use('/client', authenticateToken, verifyAdmin, clientRouter)
router.use('/auth', authRouter)

function verifyAdmin(req: any, res: any, next: any) {
  const { user } = req
  if (!user?.isadmin) return res.status(403).send('Admin account required')
  next()
}

export default router
