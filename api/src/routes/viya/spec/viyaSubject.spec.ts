import express from 'express'
import request from 'supertest'
import { createViyaRouter, viyaGuard } from '../index'
import { viyaServices } from '../services'

// Synthetic authenticated principals exercise the real guard/router/service
// wiring with the installed API, not sign-in or a live Viya installation.
const mountAs = (username: string, userId: string) => {
  const server = express()
  server.use(express.json())
  server.use(
    viyaGuard(
      (req, _res, next) => {
        req.user = {
          userId,
          clientId: 'viya-client',
          username,
          displayName: username,
          isAdmin: false,
          isActive: true,
          needsToUpdatePassword: false
        }
        next()
      },
      (_req, _res, next) => next()
    ),
    createViyaRouter(viyaServices)
  )
  return request(server)
}

describe('Viya compute ownership at the server mount', () => {
  let serverUrl: string | undefined

  beforeAll(() => {
    // Supertest uses separate listener ports; all requests must share one estate.
    serverUrl = process.env.API_SERVER_URL
    process.env.API_SERVER_URL = 'http://viya-subject.test'
  })

  afterAll(() => {
    if (serverUrl === undefined) delete process.env.API_SERVER_URL
    else process.env.API_SERVER_URL = serverUrl
  })

  it('keeps ownership with the account across a username change', async () => {
    const original = mountAs('alice', 'account-1')
    const contexts = await original.get('/compute/contexts').expect(200)
    const session = await original
      .post(`/compute/contexts/${contexts.body.items[0].id}/sessions`)
      .send({})
      .expect(201)
    const state = `/compute/sessions/${session.body.id}/state`
    expect(typeof session.body.id).toBe('string')

    await original.get(state).expect(200)
    await mountAs('alicia', 'account-1').get(state).expect(200)
    await mountAs('alice', 'account-2').get(state).expect(404)
  })
})
