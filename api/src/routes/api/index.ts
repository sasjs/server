import express from 'express'

import swaggerUi from 'swagger-ui-express'

import {
  authenticateAccessToken,
  desktopRestrict,
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
router.use('/session', authenticateAccessToken, sessionRouter)
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
router.use(
  '/permission',
  desktopRestrict,
  authenticateAccessToken,
  permissionRouter
)

router.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerOptions: {
      url: '/swagger.yaml',
      requestInterceptor: (request: any) => {
        request.credentials = 'include'

        const cookie = document.cookie
        const startIndex = cookie.indexOf('XSRF-TOKEN')
        const csrf = cookie.slice(startIndex + 11).split('; ')[0]
        request.headers['X-XSRF-TOKEN'] = csrf
        return request
      }
    }
  })
)

export default router
