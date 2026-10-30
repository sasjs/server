import express from 'express'

import {
  authenticateAccessToken,
  desktopRestrict,
  verifyAdmin
} from '../../middlewares'

import infoRouter from './info'
import adminRouter from './admin'
import driveRouter from './drive'
import stpRouter from './stp'
import codeRouter from './code'
import userRouter from './user'
import groupRouter from './group'
import clientRouter from './client'
import authRouter from './auth'
import sessionRouter from './session'
import permissionRouter from './permission'
import authConfigRouter from './authConfig'

const router = express.Router()

router.use('/info', infoRouter)
// Read-only operational data (logs, disk usage, version) is for administrators
// only: verifyAdmin answers 401 for anyone else, and passes every caller in
// desktop mode, where there is one fixed user and no permission model.
router.use('/admin', authenticateAccessToken, verifyAdmin, adminRouter)
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
  '/authConfig',
  desktopRestrict,
  authenticateAccessToken,
  verifyAdmin,
  authConfigRouter
)

// The API documentation page is a file in public/SASjsApi/ (index.html plus the
// assets copied beside it at build time), served by the express.static mount in
// app.ts. It is not a route here: the page and its assets are plain files, and
// nothing in them is rendered per request.

export default router
