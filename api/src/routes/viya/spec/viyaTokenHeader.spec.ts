/**
 * The token port's answers are marked as well, and this is the only place that can
 * be tested without a database.
 *
 * `/SASLogon/oauth/token` is answered by this server rather than by the emulator,
 * and the branch that answers it returns before any handler runs - which is how it
 * came to be the one answer without `x-sasjs-emulated`. Decision 5 of
 * sasjs/server#665 asks for the header on "every response ... including refusals",
 * so the mount stamps it before the branch, and this case pins that ordering.
 *
 * The token handler is stubbed: the real one checks credentials against the
 * database, and this case is about where the header is set, not about what the
 * port answers. A live assertion on the real endpoint lives in the conformance
 * run, which has a database and an account.
 */
import express from 'express'
import request from 'supertest'

import { configureBodyParsers } from '../../../app-modules'
import { createViyaRouter } from '../index'
import type { Services } from '@sasjs/api'

jest.mock('../token', () => ({
  ...jest.requireActual('../token'),
  oauthToken: async (_req: unknown, res: express.Response) =>
    res.status(401).json({ error: 'invalid_client' })
}))

const services = (): Services => ({
  drive: undefined as never,
  identity: undefined as never,
  viya: {
    serverUrl: 'http://localhost:5000',
    execute: async () => ({ webout: '', log: '' })
  }
})

const mount = () => {
  const server = express()

  configureBodyParsers(server)
  server.use('/', createViyaRouter(services))
  server.use('/', (_req, res) => res.status(418).json({ message: 'not viya' }))

  return server
}

describe('the header on the mount', () => {
  it('marks a refusal from the token port', async () => {
    const answer = await request(mount())
      .post('/SASLogon/oauth/token')
      .type('form')
      .send({ grant_type: 'password' })

    expect(answer.status).toBe(401)
    expect(answer.headers['x-sasjs-emulated']).toMatch(/^viya@/)
    expect(answer.headers['access-control-expose-headers']).toContain(
      'x-sasjs-emulated'
    )
  })

  it('leaves a path it does not answer unmarked', async () => {
    const answer = await request(mount()).get('/SASjsApi/info')

    expect(answer.status).toBe(418)
    expect(answer.headers['x-sasjs-emulated']).toBeUndefined()
  })
})
