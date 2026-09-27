import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import appPromise from '../../../app'
import { UserController } from '../../../controllers/'
import {
  getLoginThrottleConfig,
  resetLoginFailures
} from '../../../utils/loginThrottle'

/**
 * The lockout is keyed on the username, not the IP: behind a reverse
 * proxy every client shares one address, so an IP-keyed limiter locks
 * out the whole deployment.
 * These specs pin the behaviour the username keying is meant to give:
 * a locked account is refused with 429 before its password is checked,
 * and a successful login clears the counter.
 */
describe('login throttle', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const userController = new UserController()

  const user = {
    id: 1234,
    displayName: 'Test User',
    username: 'throttleuser',
    password: '87654321',
    isAdmin: false,
    isActive: true
  }

  const { maxFailures } = getLoginThrottleConfig()

  beforeAll(async () => {
    app = await appPromise

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    await userController.createUser(user)
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  /**
   * A valid CSRF token in its own session, so the request reaches the
   * login handler and its failures are counted.
   */
  const newAgentWithToken = async (): Promise<any> => {
    const agent: any = request.agent(app)
    const home = await agent.get('/')
    const csrfToken = /XSRF-TOKEN=(.*?);/.exec(home.text)?.[1]
    return { agent, csrfToken }
  }

  const wrongPassword = (agent: any, csrfToken: string, username: string) =>
    agent
      .post('/SASLogon/login')
      .set('x-xsrf-token', csrfToken)
      .send({ username, password: 'wrongpassword' })

  it('refuses the login with 429 once the username has failed too often', async () => {
    const { agent, csrfToken } = await newAgentWithToken()

    for (let i = 0; i < maxFailures; i++) {
      const res = await wrongPassword(agent, csrfToken, user.username)
      expect(res.status).toBe(401)
    }

    const res = await wrongPassword(agent, csrfToken, user.username)
    expect(res.status).toBe(429)
    expect(res.text).toContain('Too Many Failed Attempts')
  })

  it('does not lock a different username', async () => {
    const { agent, csrfToken } = await newAgentWithToken()

    const res = await wrongPassword(agent, csrfToken, user.username)
    expect(res.status).toBe(429)

    const res2 = await wrongPassword(agent, csrfToken, 'someotheruser')
    expect(res2.status).toBe(401)
    expect(res2.text).not.toContain('Too Many Failed Attempts')
  })

  it('resets the counter after a successful login', async () => {
    const { agent, csrfToken } = await newAgentWithToken()

    for (let i = 0; i < maxFailures; i++) {
      await wrongPassword(agent, csrfToken, user.username)
    }

    const blocked = await agent
      .post('/SASLogon/login')
      .set('x-xsrf-token', csrfToken)
      .send({ username: user.username, password: user.password })
    expect(blocked.status).toBe(429)

    resetLoginFailures(user.username)

    const res = await agent
      .post('/SASLogon/login')
      .set('x-xsrf-token', csrfToken)
      .send({ username: user.username, password: user.password })
    expect(res.status).toBe(200)
    expect(res.body.loggedIn).toBe(true)

    // A fresh counter means a single wrong password is answered 401,
    // not 429 - the reset happened, not a window expiring.
    const next = await wrongPassword(agent, csrfToken, user.username)
    expect(next.status).toBe(401)
  })
})
