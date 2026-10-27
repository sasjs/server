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
 * permission problem. Anything *without* a numeric code is a genuine failure in
 * the handler (EACCES, EMFILE, an unexpected throw): that is a 500, logged
 * before it is answered, because reporting it as 403 would blame the caller and
 * leave nothing in the logs.
 */
export const sendError = (res: express.Response, err: any) => {
  // A numeric `code` is not automatically an HTTP status: driver-style errors
  // carry numbers like 11000 (duplicate key) or 13 (unauthorized), and
  // res.status(11000) throws inside the handler, leaving the caller with no
  // response at all. Only 4xx/5xx are honoured.
  const code =
    typeof err?.code === 'number' && err.code >= 400 && err.code <= 599
      ? err.code
      : 500

  if (code >= 500) {
    const logger = (process as any).logger

    if (logger?.error) logger.error('Admin route failed:', err)
    else console.error('Admin route failed:', err)
  }

  res
    .status(code)
    .send(code >= 500 ? 'Internal server error' : (err?.message ?? String(err)))
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
