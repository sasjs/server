import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import { DEFAULT_IDENTITY, RECORD_CORPUS } from '@sasjs/api'
import type { CorpusCase, IdentityFixture } from '@sasjs/api'

import appPromise from '../../../app'
import User from '../../../model/User'
import Group from '../../../model/Group'
import Permission from '../../../model/Permission'
import Client from '../../../model/Client'
import { generateAccessToken, saveTokensInDB } from '../../../utils'

/**
 * The record corpus is what "the same API" means for the administration
 * surface: the cases @sasjs/api runs against its own services and the browser
 * build, run here against this server's real HTTP surface and a real database.
 *
 * It is the second half of the drive corpus, and the half that matters more for
 * drift: the statuses and messages a client sees here were copied from these
 * controllers by hand, so a change here that the package does not carry now
 * fails a case instead of surfacing on a host months later.
 *
 * Two things are translated rather than asserted away. A fixture's identifiers
 * are its own (`user-admin`, `group-admins`); this server's are ObjectIds, so
 * the seed records the mapping and the request path and any `principalId` are
 * rewritten through it. Tokens a fixture ships (`admin-access`) are minted here
 * for the same account, so a case that signs in as an administrator really is
 * one.
 */
describe('record conformance corpus', () => {
  let app: Express
  let con: Mongoose
  let mongoServer: MongoMemoryServer

  // fixture identifier -> this database's, for users, groups and permissions
  let ids: Map<string, string>
  // fixture access token -> the one this server minted for that account
  let tokens: Map<string, string>
  // fixture username -> this database's id, for group membership and rules
  let byUsername: Map<string, string>

  beforeAll(async () => {
    app = await appPromise
    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())
  })

  afterAll(async () => {
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
  })

  const seed = async (fixture: IdentityFixture) => {
    await Promise.all([
      User.deleteMany({}),
      Group.deleteMany({}),
      Permission.deleteMany({}),
      Client.deleteMany({})
    ])

    ids = new Map()
    tokens = new Map()
    byUsername = new Map()

    for (const user of fixture.users) {
      const created = await User.create({
        username: user.username,
        displayName: user.displayName,
        // the model stores a hash and takes it from here, the way the controller
        password: User.hashPassword(user.password),
        isAdmin: user.isAdmin,
        isActive: user.isActive,
        needsToUpdatePassword: user.needsToUpdatePassword,
        autoExec: user.autoExec ?? '',
        ...(user.authProvider ? { authProvider: user.authProvider } : {})
      })

      ids.set(user.uid, String(created._id))
      byUsername.set(user.username, String(created._id))
    }

    for (const group of fixture.groups) {
      const created = await Group.create({
        // the controller lowercases a group name before it stores it, so a
        // seed that kept the fixture's case would answer differently from a
        // group created through the API
        name: group.name.toLowerCase(),
        description: group.description,
        isActive: group.isActive,
        users: group.users.map((username) => byUsername.get(username)),
        ...(group.authProvider ? { authProvider: group.authProvider } : {})
      })

      ids.set(group.uid, String(created._id))
    }

    for (const rule of fixture.permissions) {
      const created = await Permission.create({
        path: rule.path,
        type: rule.type,
        setting: rule.setting,
        ...(rule.user ? { user: byUsername.get(rule.user) } : {}),
        ...(rule.group ? { group: ids.get(rule.group) } : {})
      })

      ids.set(rule.uid, String(created._id))
    }

    for (const client of fixture.clients) await Client.create({ ...client })

    for (const token of fixture.tokens || []) {
      const userId = byUsername.get(token.username)
      if (!userId) continue

      const accessToken = await generateAccessToken({
        clientId: token.clientId,
        userId
      })
      await saveTokensInDB(
        userId,
        token.clientId,
        accessToken,
        token.refreshToken || 'arefresh'
      )
      if (token.accessToken) tokens.set(token.accessToken, accessToken)
    }
  }

  /**
   * An identifier of the right shape that names nothing: this host refuses a
   * malformed one with 400 before it looks, which is a different answer from the
   * 404 a case about a missing account is asking for.
   */
  const ABSENT_ID = '0123456789abcdef01234567'

  /** The fixture's name for an identifier this host minted, for message text. */
  const fixtureName = (text: string) => {
    let answer = text.split(ABSENT_ID).join(absentName)
    ids.forEach((real, name) => {
      answer = answer.split(real).join(name)
    })
    return answer
  }

  /** A fixture identifier becomes this database's, when it is one we seeded. */
  const id = (value: unknown) => {
    const key = String(value ?? '')
    if (ids.has(key)) return ids.get(key) as string
    if (key.endsWith('-none')) {
      absentName = key
      return ABSENT_ID
    }
    return key
  }

  /** What the case called the absent identifier, for reading a message back. */
  let absentName = 'unknown'

  /**
   * The corpus names a parameter by meaning (`name`, `uid`); the route template
   * names it by position (`{groupname}`). The values travel in order.
   */
  const pathOf = (testCase: CorpusCase) => {
    const [, route] = testCase.route.split(' ')
    const values = Object.values(testCase.request.params || {})
    let at = 0
    const withParams = route.replace(/\{(\w+)\}/g, () =>
      encodeURIComponent(id(values[at++]))
    )

    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(testCase.request.query || {}))
      if (value !== undefined) query.set(key, String(value))

    return query.toString() ? `${withParams}?${query}` : withParams
  }

  /** `principalId` names a fixture account; every other field travels as sent. */
  const bodyOf = (testCase: CorpusCase) => {
    const body = testCase.request.body
    if (!body) return undefined
    if (body.principalId === undefined) return body
    return { ...body, principalId: id(body.principalId) }
  }

  /** Identifiers this host minted become the fixture's names, for comparison. */
  const inFixtureNames = (value: any): any => {
    if (typeof value === 'string') {
      let named = value
      ids.forEach((real, name) => {
        if (real === value) named = name
      })
      return named
    }
    if (Array.isArray(value)) return value.map(inFixtureNames)
    if (value && typeof value === 'object')
      return Object.fromEntries(
        Object.entries(value).map(([key, inner]) => [
          key,
          inFixtureNames(inner)
        ])
      )
    return value
  }

  /**
   * The cases this host cannot satisfy yet, each with the difference named. The
   * corpus found these on its first run, which is the point of running it: every
   * one is a place where the package's answer and this server's answer differ, so
   * a client written against one is wrong against the other.
   *
   * None is a flake and none is excused by "known difference". Each is a decision
   * about which side moves, and the decision belongs in the document, so they are
   * collected in sasjs/api#26 until it is taken.
   */
  const KNOWN_DIVERGENCES: Record<string, string> = {
    'list-groups':
      "this API stores a group name lowercased ('dcgroup') and answers what it stored, while the corpus pins the name it was created with ('DCGroup'). Either the route preserves case or names are lowercased everywhere.",
    'list-permissions-as-admin':
      'the route serialises mongoose documents, so a rule carries the populated user or group object; the corpus pins the flat identifier every host can answer.',
    'list-permissions-as-user':
      'the same shape difference, plus an empty list: the route answers the rules assigned to the caller, where the corpus expects the rules a group the caller belongs to grants.',
    'create-permission-user':
      '`path` is validated against a fixed list of routes (the Joi enum in src/utils/validation.ts), so a rule for /SASjsApi/info is refused with 400. The document states the field is a free string.',
    'create-permission-group': 'the same `path` enum.',
    'create-permission-invalid-principal-type':
      'the same `path` enum, which answers before the principal type is examined.',
    'create-permission-admin-principal': 'the same `path` enum.',
    'create-permission-missing-principal': 'the same `path` enum.',
    'create-permission-duplicate-group': 'the same `path` enum.',
    'create-permission-duplicate':
      "the duplicate check counts the rule's setting, so the same path and principal with a different setting is created rather than refused with 409; the corpus treats path, type and principal as the identity of a rule.",
    'delete-user-by-username-wrong-password':
      'this API validates that a supplied password is at least six characters (400), where the corpus asks for the wrong-password answer (401 Invalid password.) - the document states no minimum length.'
  }

  // A case's reason is read by whoever next has to decide, so a key that names no
  // case is a stale excuse rather than documentation.
  it('every documented divergence names a case in the corpus', () => {
    const ids = RECORD_CORPUS.map((testCase) => testCase.id)
    for (const key of Object.keys(KNOWN_DIVERGENCES)) expect(ids).toContain(key)
  })

  const replayable = RECORD_CORPUS.filter(
    (testCase) => !KNOWN_DIVERGENCES[testCase.id]
  )

  it.each(replayable)('$id', async (testCase) => {
    await seed(testCase.identity || DEFAULT_IDENTITY)

    const want = testCase.expect
    const method = testCase.route.split(' ')[0].toLowerCase()
    let call = (request(app) as any)[method](pathOf(testCase))

    const body = bodyOf(testCase)
    if (body !== undefined) call = call.send(body)

    const token = testCase.request.token
      ? tokens.get(testCase.request.token)
      : undefined
    if (token) call = call.auth(token, { type: 'bearer' })

    const res = await call

    expect(res.statusCode).toBe(want.status)

    // a message the package answers as its body travels as the response text
    // here, because this host's routes send it themselves
    if (want.error !== undefined) expect(fixtureName(res.text)).toBe(want.error)

    if (typeof want.body === 'string') expect(res.text).toBe(want.body)
    else if (want.body !== undefined)
      expect(inFixtureNames(res.body)).toEqual(want.body)
  })
})
