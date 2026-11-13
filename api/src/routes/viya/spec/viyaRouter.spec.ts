import express from 'express'
import request from 'supertest'

import { createViyaRouter, isViyaPath } from '../index'
import type { Services } from '@sasjs/api'

/**
 * The mount, and the boundary around it.
 *
 * These cases do not boot the server: the emulator's behaviour is `@sasjs/api`'s
 * and is tested there. What is this server's is the wiring - which paths the
 * router answers, what it leaves to the server's own routes, and whether the
 * caller's account and this server's engine reach the emulator at all.
 */
const withExecution = (webout: string, log: string): Services => ({
  drive: undefined as never,
  identity: undefined as never,
  viya: {
    serverUrl: 'http://localhost:5000',
    execute: async () => ({ webout, log })
  }
})

const app = (services: (req: express.Request) => Services) => {
  const server = express()

  server.use(express.json())
  server.use('/', createViyaRouter(services))
  // what the server's own routes would answer for anything the router declines
  server.use('/', (_req, res) => res.status(418).json({ message: 'not viya' }))

  return server
}

describe('the Viya mount', () => {
  it('answers the paths a Viya client uses, with the emulated header', async () => {
    const answer = await request(app(() => withExecution('[]', ''))).get(
      '/compute/contexts'
    )

    expect(answer.status).toBe(200)
    expect(answer.headers['x-sasjs-emulated']).toMatch(/^viya@/)
    expect(answer.body.items[0].name).toBeTruthy()
  })

  it('leaves everything else to the server own routes', async () => {
    const answer = await request(app(() => withExecution('[]', ''))).get(
      '/SASjsApi/info'
    )

    expect(answer.status).toBe(418)
  })

  it('knows a prefix from a path that merely starts with it', () => {
    expect(isViyaPath('/compute/contexts')).toBe(true)
    expect(isViyaPath('/compute')).toBe(true)
    // `/computer` is not `/compute`
    expect(isViyaPath('/computer')).toBe(false)
  })

  it('runs a submitted service on the engine and serves its webout', async () => {
    const services: Services = withExecution('[{"COL1":"real"}]', 'NOTE: ran')
    const mount = app(() => services)

    const session = await request(mount)
      .post('/compute/contexts/emulated/sessions')
      .send({})

    expect(session.status).toBe(404)

    const sessionFromList = await request(mount).get('/compute/contexts')
    const contextId = sessionFromList.body.items[0].id

    const created = await request(mount)
      .post(`/compute/contexts/${contextId}/sessions`)
      .send({})

    expect(created.status).toBe(201)

    const sessionId = created.body.id as string

    const submitted = await request(mount)
      .post(`/compute/sessions/${sessionId}/jobs`)
      .send({ code: ['%put hi;'], name: '/app/services/getdata' })

    expect(submitted.status).toBe(201)

    // the run answers behind the 201, so settle before reading the answer
    await new Promise((resolve) => setTimeout(resolve, 10))

    const webout = await request(mount).get(
      `/compute/sessions/${sessionId}/filerefs/_webout/content`
    )

    expect(webout.status).toBe(200)
    expect(webout.text).toBe('[{"COL1":"real"}]')
  })

  it('serves a webout as raw bytes, not as a quoted JSON string', async () => {
    const services = withExecution('line one\nline two', '')
    const mount = app(() => services)

    const contexts = await request(mount).get('/compute/contexts')
    const created = await request(mount)
      .post(`/compute/contexts/${contexts.body.items[0].id}/sessions`)
      .send({})

    await request(mount)
      .post(`/compute/sessions/${created.body.id}/jobs`)
      .send({ code: ['data a; run;'] })

    await new Promise((resolve) => setTimeout(resolve, 10))

    const answer = await request(mount).get(
      `/compute/sessions/${created.body.id}/filerefs/_webout/content`
    )

    // a host that mapped `body` would answer "\"line one\\nline two\""
    expect(answer.text).toBe('line one\nline two')
  })
})
