export const verifyAdmin = (req: any, res: any, next: any) => {
  const { MODE } = process.env
  if (MODE?.trim() === 'desktop') return next()

  const { user } = req
  if (!user?.isAdmin) return res.status(401).send('Admin account required')
  next()
}
