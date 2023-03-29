import { RequestHandler } from 'express'
import { RateLimiter, secondsToHms } from '../utils'

export const bruteForceProtection: RequestHandler = async (req, res, next) => {
  const ip = req.ip
  const username = req.body.username

  const rateLimiter = RateLimiter.getInstance()

  const retrySecs = await rateLimiter.check(ip, username)

  if (retrySecs > 0) {
    res
      .status(429)
      .send(`Too Many Requests! Retry after ${secondsToHms(retrySecs)}`)

    return
  }

  next()
}
