export const desktopRestrict = (req: any, res: any, next: any) => {
  const { MODE } = process.env
  if (MODE === 'desktop')
    return res.status(403).send('Not Allowed while in Desktop Mode.')

  next()
}
