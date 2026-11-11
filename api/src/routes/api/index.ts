import express, { RequestHandler } from 'express'

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
import appRouter from './app'

/**
 * One router, and what has to pass before a request reaches it.
 *
 * The mounts are data rather than a run of `router.use` calls because they are
 * also what the route check reads: a table can be walked, and a walk is the only
 * way to ask the other half of the question the OpenAPI document cannot - which
 * mounted operations the document does not state. See
 * `src/routes/spec/mountedRoutes.spec.ts`.
 */
export interface ApiMount {
  /** The path this router is mounted at, below whichever API prefix served it. */
  path: string

  router: express.Router

  /** Middleware that runs first, in order. */
  guards?: RequestHandler[]
}

export const API_MOUNTS: ApiMount[] = [
  { path: '/info', router: infoRouter },
  // Read-only operational data (logs, disk usage, version) is for administrators
  // only: verifyAdmin answers 401 for anyone else, and passes every caller in
  // desktop mode, where there is one fixed user and no permission model.
  {
    path: '/admin',
    router: adminRouter,
    guards: [authenticateAccessToken, verifyAdmin]
  },
  {
    path: '/session',
    router: sessionRouter,
    guards: [authenticateAccessToken]
  },
  { path: '/auth', router: authRouter, guards: [desktopRestrict] },
  {
    path: '/client',
    router: clientRouter,
    guards: [desktopRestrict, authenticateAccessToken, verifyAdmin]
  },
  {
    path: '/drive',
    router: driveRouter,
    guards: [authenticateAccessToken]
  },
  { path: '/group', router: groupRouter, guards: [desktopRestrict] },
  { path: '/stp', router: stpRouter, guards: [authenticateAccessToken] },
  { path: '/code', router: codeRouter, guards: [authenticateAccessToken] },
  { path: '/user', router: userRouter, guards: [desktopRestrict] },
  {
    path: '/permission',
    router: permissionRouter,
    guards: [desktopRestrict, authenticateAccessToken]
  },
  // What is deployed under one App Stream name: the entry as registered (appLoc,
  // streamWebFolder, streamLogo, frameAncestors, publishedAt) plus the served entry
  // file and its mtime, which is what a deploy script or an operator asks for.
  { path: '/app', router: appRouter, guards: [authenticateAccessToken] },
  {
    path: '/authConfig',
    router: authConfigRouter,
    guards: [desktopRestrict, authenticateAccessToken, verifyAdmin]
  }
]

const router = express.Router()

API_MOUNTS.forEach((mount) =>
  router.use(mount.path, ...(mount.guards ?? []), mount.router)
)

// The API documentation page is a file in public/SASjsApi/ (index.html plus the
// assets copied beside it at build time), served by the express.static mount in
// app.ts. It is not a route here: the page and its assets are plain files, and
// nothing in them is rendered per request.

export default router
