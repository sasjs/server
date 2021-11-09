export const verifyAdminIfNeeded = (req: any, res: any, next: any) => {
  const { user } = req
  const userId = parseInt(req.params.userId)

  if (!user.isAdmin && user.userId !== userId) {
    return res.status(401).send('Admin account required')
  }
  next()
}
