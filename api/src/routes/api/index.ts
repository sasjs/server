import express from 'express'

import swaggerUi from 'swagger-ui-express'

import {
  authenticateAccessToken,
  desktopRestrict,
  desktopUsername,
  verifyAdmin
} from '../../middlewares'

import driveRouter from './drive'
import stpRouter from './stp'
import userRouter from './user'
import groupRouter from './group'
import clientRouter from './client'
import authRouter from './auth'
import sessionRouter from './session'

const router = express.Router()

router.use('/session', desktopUsername, authenticateAccessToken, sessionRouter)
router.use('/auth', desktopRestrict, authRouter)
router.use(
  '/client',
  desktopRestrict,
  authenticateAccessToken,
  verifyAdmin,
  clientRouter
)
router.use('/drive', authenticateAccessToken, driveRouter)
router.use('/group', desktopRestrict, groupRouter)
router.use('/stp', authenticateAccessToken, stpRouter)
router.use('/user', desktopRestrict, userRouter)
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
