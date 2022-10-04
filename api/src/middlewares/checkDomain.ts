import { RequestHandler } from 'express'

export const checkDomain: RequestHandler = (req, res, next) => {
  const { allowedDomains } = process

  // pass if no allowed domain is specified
  if (!allowedDomains.length) return next()

  if (allowedDomains.includes(req.hostname)) return next()

  console.log('allowedDomains', allowedDomains)
  console.log('hostname not allowed', req.hostname)
  res.writeHead(404, {
    'Content-Type': 'text/plain'
  })
  return res.end('Not found')
}
