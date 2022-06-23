import { RequestHandler } from 'express'

// This middleware checks if a non-admin user trying to
// access information of other user
export const verifyAdminIfNeeded: RequestHandler = (req, res, next) => {
  const { user } = req

  if (!user?.isAdmin) {
    let adminAccountRequired: boolean = true

    if (req.params.userId) {
      adminAccountRequired = user?.userId !== parseInt(req.params.userId)
    } else if (req.params.username) {
      adminAccountRequired = user?.username !== req.params.username
    }

    if (adminAccountRequired)
      return res.status(401).send('Admin account required')
  }

  next()
}
