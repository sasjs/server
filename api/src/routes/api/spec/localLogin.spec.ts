import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import appPromise from '../../../app'
import { UserController } from '../../../controllers/'

/**
 * LOCAL_LOGIN_ENABLED=false closes the local (database) password path: the
 * stored hash is never compared, so there is no credential to attack.
 *
 * That matters on a deployment whose Cloudron manifest carries
 * `supportsBearerAuth: true`: the platform's login wall and MFA are skipped for
 * any request that sends a Bearer header, which leaves /SASLogon/login
 * reachable from the internet, and the local password login is the one
 * credential such a caller can guess. Accounts that authenticate through an
 * identity provider sign in through the provider, and LDAP-verified sign-in is
 * unaffected, so switching the local path off does not lock anyone out who has
 * another way in.
 */
describe('local login toggle', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  const userController = new UserController()

  const user = {
    id: 4321,
    displayName: 'Local User',
    username: 'localuser',
    password: '87654321',
    isAdmin: false,
    isActive: true
  }

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

  afterEach(() => {
    // delete, not `= undefined`: assigning undefined to process.env stores the
    // string "undefined", which is not a boolean and would leak into sibling
    // specs sharing this worker.
    delete process.env.LOCAL_LOGIN_ENABLED
  })

  /**
   * A valid CSRF token in its own session, so the request reaches the login
   * handler rather than being refused by the CSRF check.
   */
  const newAgentWithToken = async (): Promise<any> => {
    const agent: any = request.agent(app)
    const home = await agent.get('/')
    const csrfToken = /XSRF-TOKEN=(.*?);/.exec(
      (home.headers['set-cookie'] as string[]).join(';')
    )?.[1]
    return { agent, csrfToken }
  }

  const attemptLogin = (agent: any, csrfToken: string, password: string) =>
    agent
      .post('/SASLogon/login')
      .set('x-xsrf-token', csrfToken)
      .send({ username: user.username, password })

  /** A session-authenticated route: 200 once signed in, 401 when not. */
  const sessionProbe = (agent: any) =>
    agent.get(`/SASjsApi/user/by/username/${user.username}`)

  it('accepts the correct password while the local login is enabled', async () => {
    const { agent, csrfToken } = await newAgentWithToken()

    const res = await attemptLogin(agent, csrfToken, user.password)
    expect(res.status).toBe(200)
    expect(res.body.loggedIn).toBe(true)

    expect((await sessionProbe(agent)).status).toBe(200)
  })

  it('refuses the correct password once the local login is switched off', async () => {
    const { agent, csrfToken } = await newAgentWithToken()
    process.env.LOCAL_LOGIN_ENABLED = 'false'

    const res = await attemptLogin(agent, csrfToken, user.password)
    expect(res.status).toBe(401)
    expect(res.text).toContain('disabled for local accounts')
  })

  it('answers a wrong password and the correct one identically when switched off', async () => {
    const { agent, csrfToken } = await newAgentWithToken()
    process.env.LOCAL_LOGIN_ENABLED = 'false'

    // Same status and same body: the stored hash is never reached, so neither
    // request proves anything about the password.
    const wrong = await attemptLogin(agent, csrfToken, 'wrongpassword')
    const right = await attemptLogin(agent, csrfToken, user.password)

    expect(wrong.status).toBe(401)
    expect(right.status).toBe(401)
    expect(right.text).toEqual(wrong.text)
  })

  it('does not start a session for a refused local login', async () => {
    const { agent, csrfToken } = await newAgentWithToken()
    process.env.LOCAL_LOGIN_ENABLED = 'false'

    await attemptLogin(agent, csrfToken, user.password)

    expect((await sessionProbe(agent)).status).toBe(401)
  })
})
