/**
 * The two JSON body limits, and the order they are mounted in.
 *
 * A deploy tree travels as JSON in which file contents are base64 - 4/3 of what
 * they write - so a tree at `DEPLOY_LIMITS.totalBytes` reaches the parser at up
 * to ~134MB and the deploy routes need a larger limit than the rest of the API.
 * Express lets a path-mounted parser run first, and the global one then SKIPS
 * the request because the body is already read; this proves that arrangement,
 * because getting it wrong is silent - the bigger limit is never consulted and
 * the parser refuses with its own shape.
 *
 * The middleware lines are the ones `src/app.ts` mounts, in the same order. A
 * body slightly over the global limit is what tells them apart: the deploy route
 * accepts it, every other route refuses it.
 */
import express from 'express'
import request from 'supertest'
import { DEPLOY_PAYLOAD_BYTES } from '@sasjs/api'

const app = express()

app.use('/deploy', express.json({ limit: DEPLOY_PAYLOAD_BYTES }))
app.use(express.json({ limit: '100mb' }))

app.post('/deploy', (req, res) => res.json({ entries: Object.keys(req.body) }))
app.post('/other', (req, res) => res.json({ entries: Object.keys(req.body) }))

/** A body over the global 100MB limit, under the deploy one. */
const bigBody = { payload: '.'.repeat(105 * 1024 * 1024) }

describe('the JSON body limits', () => {
  it('admits an over-global-limit body on the deploy path', async () => {
    const res = await request(app).post('/deploy').send(bigBody)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ entries: ['payload'] })
  }, 120000)

  it('keeps the global limit everywhere else', async () => {
    const res = await request(app).post('/other').send(bigBody)

    expect(res.status).toBe(413)
  }, 120000)
})
