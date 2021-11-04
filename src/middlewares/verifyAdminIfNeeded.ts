export const verifyAdminIfNeeded = (req: any, res: any, next: any) => {
  const { user } = req
  const { username } = req.params

  if (!user.isAdmin && user.username !== username) {
    return res.status(401).send('Admin account required')
  }
  next()
}
