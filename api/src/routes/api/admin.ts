import express from 'express'
import { AdminController } from '../../controllers'

const adminRouter = express.Router()

/**
 * Auth is applied at the mount point in routes/api/index.ts
 * (`router.use('/admin', authenticateAccessToken, verifyAdmin, adminRouter)`),
 * so a handler here only ever runs for an administrator.
 *
 * The controller throws `{ code, message }` for a refused log name, which is
 * passed through so a traversal attempt answers 400 rather than looking like a
 * permission problem - 403 would suggest the caller is not an admin, and they
 * are.
 */
const sendError = (res: express.Response, err: any) => {
  const code = typeof err?.code === 'number' ? err.code : 403

  res.status(code).send(err?.message ?? err?.toString() ?? 'Error')
}

adminRouter.get('/diagnostics', async (req, res) => {
  const controller = new AdminController()

  try {
    res.send(await controller.diagnostics())
  } catch (err: any) {
    sendError(res, err)
  }
})

adminRouter.get('/logs', async (req, res) => {
  const controller = new AdminController()

  try {
    res.send(await controller.logs())
  } catch (err: any) {
    sendError(res, err)
  }
})

adminRouter.get('/logs/:fileName', async (req, res) => {
  const controller = new AdminController()
  const lines =
    req.query.lines === undefined ? undefined : Number(req.query.lines)

  try {
    res.send(
      await controller.logTail(
        req.params.fileName,
        Number.isFinite(lines as number) ? (lines as number) : undefined
      )
    )
  } catch (err: any) {
    sendError(res, err)
  }
})

export default adminRouter
