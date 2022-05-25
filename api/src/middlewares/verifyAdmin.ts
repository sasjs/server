import { RequestHandler } from 'express'

export const verifyAdmin: RequestHandler = (req, res, next) => {
  const { MODE } = process.env
  if (MODE?.trim() !== 'server') return next()

  const { user } = req
  if (!user?.isAdmin) return res.status(401).send('Admin account required')
  next()
}
