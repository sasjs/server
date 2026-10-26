import express from 'express'
import { createServer, Server } from 'http'
import { AddressInfo } from 'net'
import { listen } from '../listen'
import { ListenerConfig } from '../utils/resolveListeners'

const app = express()

app.get('/probe', (_req, res) => res.status(200).send('ok'))

app.get('/slow', (_req, res) => {
  setTimeout(() => res.status(200).send('done'), 150)
})

const config = (port: number): ListenerConfig => ({
  httpPort: port,
  httpsPort: 0,
  httpBindAddress: '127.0.0.1'
})

const get = (port: number, path = '/probe') =>
  fetch(`http://127.0.0.1:${port}${path}`)

/**
 * A port the OS is not using right now. Fixed port numbers make the suite fail at
 * bind - "could not bind" - when a parallel run or a stray process holds one,
 * which reads as a code failure rather than a collision.
 */
const freePort = (): Promise<number> =>
  new Promise((resolve, reject) => {
    const probe: Server = createServer()

    probe.once('error', reject)
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address() as AddressInfo
      probe.close(() => resolve(port))
    })
  })

describe('listen', () => {
  it('should serve the app on the plain HTTP port', async () => {
    const port = await freePort()
    const listeners = await listen(app, config(port))

    try {
      expect(listeners.servers).toHaveLength(1)
      expect(listeners.description).toEqual(`http on 127.0.0.1:${port}`)

      const res = await get(port)

      expect(res.status).toEqual(200)
      expect(await res.text()).toEqual('ok')
    } finally {
      await listeners.close()
    }
  })

  it('should stop serving once closed', async () => {
    const port = await freePort()
    const listeners = await listen(app, config(port))

    await listeners.close()

    await expect(get(port)).rejects.toThrow()
  })

  it('should let a request in flight finish before closing', async () => {
    const port = await freePort()
    const listeners = await listen(app, config(port))

    const inFlight = get(port, '/slow')

    // give the request time to reach the handler, then shut down under it
    await new Promise((resolve) => setTimeout(resolve, 50))
    await listeners.close()

    const res = await inFlight

    expect(res.status).toEqual(200)
    expect(await res.text()).toEqual('done')
  })

  it('should reject, naming the variable, when the port is already taken', async () => {
    const port = await freePort()
    const first = await listen(app, config(port))

    try {
      await expect(listen(app, config(port))).rejects.toThrow(
        `HTTP_PORT could not bind port ${port}`
      )
    } finally {
      await first.close()
    }
  })
})
