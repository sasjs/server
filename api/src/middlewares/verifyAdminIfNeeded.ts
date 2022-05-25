import { RequestHandler } from 'express'

export const verifyAdminIfNeeded: RequestHandler = (req, res, next) => {
  const { user } = req
  const userId = parseInt(req.params.userId)

  if (!user?.isAdmin && user?.userId !== userId) {
    return res.status(401).send('Admin account required')
  }
  next()
}
