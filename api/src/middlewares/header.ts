import { Request, Response } from 'express'

export const verifyAcceptHeader = (req: Request, res: Response) => {
  const acceptHeader = req.headers.accept

  if (!acceptHeader) {
    return res.status(406).json(headerIsNotPresentMessage('Accept'))
  } else if (acceptHeader !== 'application/json') {
    return res.status(406).json(headerIsNotValidMessage('Accept'))
  }
}

export const verifyContentTypeHeader = (req: Request, res: Response) => {
  const contentTypeHeader = req.headers['content-type']

  if (!contentTypeHeader) {
    return res.status(406).json(headerIsNotPresentMessage('Content-Type'))
  } else if (contentTypeHeader !== 'application/json') {
    return res.status(406).json(headerIsNotValidMessage('Content-Type'))
  }
}

export const headerIsNotPresentMessage = (header: string) => ({
  message: `${header} header is not present.`
})

export const headerIsNotValidMessage = (header: string) => ({
  message: `${header} header is not valid.`
})
