import { EventEmitter } from 'events'
import { drainBody } from '../drainBody'

/**
 * drainBody is what stops a refusal of an in-flight upload from resetting the
 * connection under the client (see the module's own comment). Its contract is
 * small and worth pinning, because every branch of it decides whether a
 * response is ever sent: a request with no body must not wait, and a client
 * that disappears must not leave the response hanging.
 */
const fakeRequest = (overrides: { [key: string]: any } = {}) => {
  const req: any = new EventEmitter()

  req.readableEnded = false
  req.complete = false
  req.resume = () => {
    req.resumed = true
  }

  return Object.assign(req, overrides)
}

describe('drainBody', () => {
  it('resolves without reading when the body has already been consumed', async () => {
    const req = fakeRequest({ readableEnded: true })

    await drainBody(req)

    expect(req.resumed).toBeUndefined()
  })

  it('resolves without reading when the request is already complete', async () => {
    const req = fakeRequest({ complete: true })

    await drainBody(req)

    expect(req.resumed).toBeUndefined()
  })

  it('waits for the body to finish arriving', async () => {
    const req = fakeRequest()
    let resolved = false

    const drained = drainBody(req).then(() => {
      resolved = true
    })

    // Reading is what keeps the socket open while the client is still writing.
    expect(req.resumed).toBe(true)

    await Promise.resolve()
    expect(resolved).toBe(false)

    req.emit('end')
    await drained

    expect(resolved).toBe(true)
  })

  it('resolves when the client aborts rather than waiting forever', async () => {
    const req = fakeRequest()

    const drained = drainBody(req)
    req.emit('aborted')

    await expect(drained).resolves.toBeUndefined()
  })

  it('resolves on a stream error rather than waiting forever', async () => {
    const req = fakeRequest()

    const drained = drainBody(req)
    req.emit('error', new Error('boom'))

    await expect(drained).resolves.toBeUndefined()
  })
})
