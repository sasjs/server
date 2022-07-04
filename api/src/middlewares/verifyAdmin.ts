import { RequestHandler } from 'express'
import { ModeType } from '../utils'

export const verifyAdmin: RequestHandler = (req, res, next) => {
  const { MODE } = process.env
  if (MODE === ModeType.Desktop) return next()

  const { user } = req
  if (!user?.isAdmin) return res.status(401).send('Admin account required')
  next()
}
