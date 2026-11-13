/**
 * The mount as `setupRoutes` wires it.
 *
 * The router's own spec cannot see the wiring, and the wiring is where the guard
 * regressions land: scope (a root guard once turned `GET /` into a 401) and
 * ordering (the estate must be mounted ahead of the web router, which answers
 * every unmatched path with the application shell).
 */
import express from 'express'
import { mkdtemp } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import request from 'supertest'

import { ModeType } from '../../../utils'

describe('the mount behind setupRoutes', () => {
  beforeAll(async () => {
    // what the server sets at boot: the routers below read these while they are
    // being imported, so they are set before `setupRoutes` is
    const root = await mkdtemp(join(tmpdir(), 'viya-mount-'))

    process.sasjsRoot = root
    process.driveLoc = join(root, 'drive')
    process.logsLoc = join(root, 'logs')

    process.env.MODE = ModeType.Server
    process.env.EMULATE_VIYA = 'true'
  })

  const boot = async () => {
    const server = express()
    const { setupRoutes } = await import('../../setupRoutes')

    await setupRoutes(server)

    return server
  }

  it('leaves the application shell reachable to a caller with no token', async () => {
    const answer = await request(await boot()).get('/')

    // the shell, not a refusal: a root-scoped guard turned this into a 401 and
    // an assertion of `not 401` alone would pass on a 500 from a missing build
    expect(answer.status).toBe(200)
    expect(answer.headers['content-type']).toMatch(/html|json/)
  })

  it('does not mount the estate when the flag is unset', async () => {
    // the compatibility promise the settings page makes, and the path every
    // existing deployment takes: with no flag the Viya paths are not the
    // emulator's, and `/compute/contexts` falls through to the web router
    const enabled = process.env.EMULATE_VIYA

    delete process.env.EMULATE_VIYA

    try {
      const server = await boot()

      const answer = await request(server).get('/compute/contexts')
      // a path nobody serves, as the control: with the flag unset a Viya path is
      // answered exactly as any other path this server does not serve. Pinning a
      // status alone would pin the web router's taste, and asserting only "no
      // emulated header" would be satisfied by the guard's 401 or by a 500.
      const control = await request(server).get('/not-a-route-at-all')

      expect(answer.headers['x-sasjs-emulated']).toBeUndefined()
      expect(control.status).toBe(404)
      expect(answer.status).toEqual(control.status)
      // express's own handler, naming the path: nothing answered it
      expect(answer.text).toMatch(/Cannot GET \/compute\/contexts/)
    } finally {
      if (enabled === undefined) delete process.env.EMULATE_VIYA
      else process.env.EMULATE_VIYA = enabled
    }
  })
})
