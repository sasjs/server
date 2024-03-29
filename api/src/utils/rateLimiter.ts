import { RateLimiterMemory } from 'rate-limiter-flexible'

export class RateLimiter {
  private static instance: RateLimiter
  private limiterSlowBruteByIP: RateLimiterMemory
  private limiterConsecutiveFailsByUsernameAndIP: RateLimiterMemory
  private maxWrongAttemptsByIpPerDay: number
  private maxConsecutiveFailsByUsernameAndIp: number

  private constructor() {
    const {
      MAX_WRONG_ATTEMPTS_BY_IP_PER_DAY,
      MAX_CONSECUTIVE_FAILS_BY_USERNAME_AND_IP
    } = process.env

    this.maxWrongAttemptsByIpPerDay = Number(MAX_WRONG_ATTEMPTS_BY_IP_PER_DAY)
    this.maxConsecutiveFailsByUsernameAndIp = Number(
      MAX_CONSECUTIVE_FAILS_BY_USERNAME_AND_IP
    )

    this.limiterSlowBruteByIP = new RateLimiterMemory({
      keyPrefix: 'login_fail_ip_per_day',
      points: this.maxWrongAttemptsByIpPerDay,
      duration: 60 * 60 * 24,
      blockDuration: 60 * 60 * 24 // Block for 1 day
    })

    this.limiterConsecutiveFailsByUsernameAndIP = new RateLimiterMemory({
      keyPrefix: 'login_fail_consecutive_username_and_ip',
      points: this.maxConsecutiveFailsByUsernameAndIp,
      duration: 60 * 60 * 24 * 24, // Store number for 24 days since first fail
      blockDuration: 60 * 60 // Block for 1 hour
    })
  }

  public static getInstance() {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter()
    }
    return RateLimiter.instance
  }

  private getUsernameIPKey(ip: string, username: string) {
    return `${username}_${ip}`
  }

  /**
   *  This method checks for brute force attack
   *  If attack is detected then returns the number of seconds after which user can make another request
   *  Else returns 0
   */
  public async check(ip: string, username: string) {
    const usernameIPkey = this.getUsernameIPKey(ip, username)

    const [resSlowByIP, resUsernameAndIP] = await Promise.all([
      this.limiterSlowBruteByIP.get(ip),
      this.limiterConsecutiveFailsByUsernameAndIP.get(usernameIPkey)
    ])

    // NOTE: To make use of blockDuration option, comparison in both following if statements should have greater than symbol
    //       otherwise, blockDuration option will not work
    // For more info see: https://github.com/animir/node-rate-limiter-flexible/wiki/Options#blockduration

    // Check if IP or Username + IP is already blocked
    if (
      resSlowByIP !== null &&
      resSlowByIP.consumedPoints > this.maxWrongAttemptsByIpPerDay
    ) {
      return Math.ceil(resSlowByIP.msBeforeNext / 1000)
    } else if (
      resUsernameAndIP !== null &&
      resUsernameAndIP.consumedPoints > this.maxConsecutiveFailsByUsernameAndIp
    ) {
      return Math.ceil(resUsernameAndIP.msBeforeNext / 1000)
    }

    return 0
  }

  /**
   * Consume 1 point from limiters on wrong attempt and block if limits reached
   * If limit is reached, return the number of seconds after which user can make another request
   * Else return 0
   */
  public async consume(ip: string, username?: string) {
    try {
      const promises = [this.limiterSlowBruteByIP.consume(ip)]
      if (username) {
        const usernameIPkey = this.getUsernameIPKey(ip, username)

        // Count failed attempts by Username + IP only for registered users
        promises.push(
          this.limiterConsecutiveFailsByUsernameAndIP.consume(usernameIPkey)
        )
      }

      await Promise.all(promises)
    } catch (rlRejected: any) {
      if (rlRejected instanceof Error) {
        throw rlRejected
      } else {
        // based upon the implementation of consume method of RateLimiterMemory
        // we are sure that rlRejected will contain msBeforeNext
        // for further reference,
        // see https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example#login-endpoint-protection
        // or see https://github.com/animir/node-rate-limiter-flexible#ratelimiterres-object
        return Math.ceil(rlRejected.msBeforeNext / 1000)
      }
    }

    return 0
  }

  public async resetOnSuccess(ip: string, username: string) {
    const usernameIPkey = this.getUsernameIPKey(ip, username)
    const resUsernameAndIP =
      await this.limiterConsecutiveFailsByUsernameAndIP.get(usernameIPkey)

    if (resUsernameAndIP !== null && resUsernameAndIP.consumedPoints > 0) {
      await this.limiterConsecutiveFailsByUsernameAndIP.delete(usernameIPkey)
    }
  }
}
