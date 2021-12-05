export const desktopRestrict = (req: any, res: any, next: any) => {
  const { MODE } = process.env
  if (MODE?.trim() !== 'server')
    return res.status(403).send('Not Allowed while in Desktop Mode.')

  next()
}
export const desktopUsername = (req: any, res: any, next: any) => {
  const { MODE } = process.env
  if (MODE?.trim() !== 'server')
    return res.status(200).send({
      userId: 12345,
      username: 'DESKTOPusername',
      displayName: 'DESKTOP User'
    })

  next()
}
