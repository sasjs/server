import { RequestHandler } from 'express'

export const desktopRestrict: RequestHandler = (req, res, next) => {
  const { MODE } = process.env
  if (MODE?.trim() !== 'server')
    return res.status(403).send('Not Allowed while in Desktop Mode.')

  next()
}
export const desktopUsername: RequestHandler = (req, res, next) => {
  const { MODE } = process.env
  if (MODE?.trim() !== 'server')
    return res.status(200).send({
      userId: 12345,
      username: 'DESKTOPusername',
      displayName: 'DESKTOP User'
    })

  next()
}
