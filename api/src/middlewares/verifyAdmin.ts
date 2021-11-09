export const verifyAdmin = (req: any, res: any, next: any) => {
  const { user } = req
  if (!user?.isAdmin) return res.status(401).send('Admin account required')
  next()
}
