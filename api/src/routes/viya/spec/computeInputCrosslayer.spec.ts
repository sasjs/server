import express from 'express'
import request from 'supertest'
import { createDriveService, MemoryDriveStore } from '@sasjs/api'
import { createViyaRouter, viyaGuard } from '../index'

test('mounted compute validates code after ownership and before invoking host executor', async () => {
  const app = express()
  app.use(express.json())
  const execute = jest.fn(async (_input: { program: string | string[] }) => ({
    state: 'completed' as const,
    log: 'mock'
  }))
  const services = {
    drive: createDriveService(new MemoryDriveStore()),
    viya: { serverUrl: 'http://compute-input-crosslayer.invalid', execute }
  }
  app.use(
    viyaGuard(
      (req, _res, next) => {
        const who = req.get('x-test-subject') || 'alice'
        req.user = {
          userId: who,
          username: who,
          clientId: 'test',
          displayName: who,
          isAdmin: false,
          isActive: true,
          needsToUpdatePassword: false
        }
        next()
      },
      (_req, _res, next) => next()
    ),
    createViyaRouter(() => services)
  )
  const contexts = await request(app).get('/compute/contexts').expect(200)
  const session = await request(app)
    .post(`/compute/contexts/${contexts.body.items[0].id}/sessions`)
    .send({})
    .expect(201)
  const path = `/compute/sessions/${session.body.id}/jobs`
  for (const code of [null, 123, ['valid', 123], { bad: true }]) {
    const response = await request(app).post(path).send({ code }).expect(400)
    expect(JSON.stringify(response.body)).toContain(
      'Compute job code must be a string or an array of strings.'
    )
    expect(execute).not.toHaveBeenCalled()
  }
  await request(app)
    .post(path)
    .set('x-test-subject', 'bob')
    .send({ code: null })
    .expect(404)
  expect(execute).not.toHaveBeenCalled()
  await request(app)
    .post(path)
    .send({ code: ['line one', 'line two'] })
    .expect(201)
  await request(app).post(path).send({}).expect(201)
  expect(execute).toHaveBeenCalledTimes(2)
  expect(execute.mock.calls[0][0]).toMatchObject({
    program: ['line one', 'line two']
  })
  expect(execute.mock.calls[1][0]).toMatchObject({ program: '' })
})
