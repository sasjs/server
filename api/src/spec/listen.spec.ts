import express from 'express'
import { listen } from '../listen'
import { ListenerConfig } from '../utils/resolveListeners'

const app = express()

app.get('/probe', (_req, res) => res.status(200).send('ok'))

app.get('/slow', (_req, res) => {
  setTimeout(() => res.status(200).send('done'), 150)
})

const config = (overrides: Partial<ListenerConfig> = {}): ListenerConfig => ({
  httpPort: 5931,
  httpsPort: 0,
  httpBindAddress: '127.0.0.1',
  ...overrides
})

const get = (port: number, path = '/probe') =>
  fetch(`http://127.0.0.1:${port}${path}`)

describe('listen', () => {
  it('should serve the app on the plain HTTP port', async () => {
    const listeners = await listen(app, config())

    try {
      expect(listeners.servers).toHaveLength(1)
      expect(listeners.description).toEqual('http on 127.0.0.1:5931')

      const res = await get(5931)

      expect(res.status).toEqual(200)
      expect(await res.text()).toEqual('ok')
    } finally {
      await listeners.close()
    }
  })

  it('should stop serving once closed', async () => {
    const listeners = await listen(app, config({ httpPort: 5932 }))

    await listeners.close()

    await expect(get(5932)).rejects.toThrow()
  })

  it('should let a request in flight finish before closing', async () => {
    const listeners = await listen(app, config({ httpPort: 5934 }))

    const inFlight = get(5934, '/slow')

    // give the request time to reach the handler, then shut down under it
    await new Promise((resolve) => setTimeout(resolve, 50))
    await listeners.close()

    const res = await inFlight

    expect(res.status).toEqual(200)
    expect(await res.text()).toEqual('done')
  })

  it('should reject, naming the variable, when the port is already taken', async () => {
    const first = await listen(app, config({ httpPort: 5933 }))

    try {
      await expect(listen(app, config({ httpPort: 5933 }))).rejects.toThrow(
        'HTTP_PORT could not bind port 5933'
      )
    } finally {
      await first.close()
    }
  })
})
