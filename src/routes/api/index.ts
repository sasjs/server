import express from 'express'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { InfoJWT } from '../../types'

import driveRouter from './drive'
import stpRouter from './stp'
import userRouter from './user'

dotenv.config()
import authRouter from './auth'

const router = express.Router()

router.use('/drive', authenticateToken, driveRouter)
router.use('/stp', authenticateToken, stpRouter)
router.use('/user', authenticateToken, verifyAdmin, userRouter)
router.use('/auth', authRouter)

function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) return res.sendStatus(401)

  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET as string,
    (err: any, data: any) => {
      if (err) return res.sendStatus(403)

      const user: InfoJWT = {
        client_id: data?.client_id,
        username: data?.username,
        isadmin: data?.isadmin,
        isactive: data?.isactive
      }
      req.user = user
      next()
    }
  )
}

function verifyAdmin(req: any, res: any, next: any) {
  const { user } = req
  if (!user.isadmin) return res.status(403).send('Admin account required')
  next()
}

export default router
