import { RateLimiterMongo } from 'rate-limiter-flexible'

export const getRateLimiters = () => {
  const {
    MAX_WRONG_ATTEMPTS_BY_IP_PER_DAY,
    MAX_CONSECUTIVE_FAILS_BY_USERNAME_AND_IP
  } = process.env

  const limiterSlowBruteByIP = new RateLimiterMongo({
    storeClient: process.dbInstance.connection,
    keyPrefix: 'login_fail_ip_per_day',
    points: Number(MAX_WRONG_ATTEMPTS_BY_IP_PER_DAY),
    duration: 60 * 60 * 24,
    blockDuration: 60 * 60 * 24 // Block for 1 day
  })

  const limiterConsecutiveFailsByUsernameAndIP = new RateLimiterMongo({
    storeClient: process.dbInstance.connection,
    keyPrefix: 'login_fail_consecutive_username_and_ip',
    points: Number(MAX_CONSECUTIVE_FAILS_BY_USERNAME_AND_IP),
    duration: 60 * 60 * 24 * 90, // Store number for 90 days since first fail
    blockDuration: 60 * 60 // Block for 1 hour
  })

  return { limiterSlowBruteByIP, limiterConsecutiveFailsByUsernameAndIP }
}
