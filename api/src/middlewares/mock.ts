import {
  verifyAuthHeaderIsPresent,
  verifyAcceptHeader,
  verifyContentTypeHeader
} from './'
import { Request, Response, NextFunction } from 'express'

export const verifyHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  switch (true) {
    case verifyAuthHeaderIsPresent(req, res) !== undefined:
      break
    case verifyAcceptHeader(req, res) !== undefined:
      break
    case verifyContentTypeHeader(req, res) !== undefined:
      break

    default:
      return next()
  }
}
