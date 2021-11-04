export const verifyAdminIfNeeded = (req: any, res: any, next: any) => {
  const { user } = req
  const { userId } = req.params

  if (!user.isAdmin && user.id !== userId) {
    return res.status(401).send('Admin account required')
  }
  next()
}
