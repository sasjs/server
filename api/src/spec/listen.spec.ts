import express from 'express'
import { listen } from '../listen'
import { ListenerConfig } from '../utils/resolveListeners'

const app = express()

app.get('/probe', (_req, res) => res.status(200).send('ok'))

const config = (overrides: Partial<ListenerConfig> = {}): ListenerConfig => ({
  httpPort: 5931,
  httpsPort: 0,
  httpBindAddress: '127.0.0.1',
  ...overrides
})

const get = (port: number) => fetch(`http://127.0.0.1:${port}/probe`)

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
      listeners.close()
    }
  })

  it('should stop serving once closed', async () => {
    const listeners = await listen(app, config({ httpPort: 5932 }))
    listeners.close()

    await expect(get(5932)).rejects.toThrow()
  })

  it('should reject, naming the variable, when the port is already taken', async () => {
    const first = await listen(app, config({ httpPort: 5933 }))

    try {
      await expect(listen(app, config({ httpPort: 5933 }))).rejects.toThrow(
        'HTTP_PORT could not bind port 5933'
      )
    } finally {
      first.close()
    }
  })
})
