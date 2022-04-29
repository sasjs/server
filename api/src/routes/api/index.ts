import express from 'express'

import swaggerUi from 'swagger-ui-express'

import {
  authenticateAccessToken,
  desktopRestrict,
  desktopUsername,
  verifyAdmin
} from '../../middlewares'

import infoRouter from './info'
import driveRouter from './drive'
import stpRouter from './stp'
import codeRouter from './code'
import userRouter from './user'
import groupRouter from './group'
import clientRouter from './client'
import authRouter from './auth'
import sessionRouter from './session'
import permissionRouter from './permission'

const router = express.Router()

router.use('/info', infoRouter)
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
router.use('/code', authenticateAccessToken, codeRouter)
router.use('/user', desktopRestrict, userRouter)
router.use('/permission', desktopRestrict, permissionRouter)
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
