/**
 * The refusal renderer: the status a controller chose, and the body a client
 * reads.
 *
 * These are the edges a review found: a Node system error carries a STRING
 * `code`, and passing it to `res.status()` throws inside the catch block, which
 * turns a refusal into a thrown error. And a 5xx must not send the internal
 * message, which the 4xx contract does require.
 */
import { sendRefusal } from '../../refusal'
import { HttpError } from '../../../utils/httpError'

const response = () => {
  const calls: { status?: number; body?: unknown } = {}
  const res: any = {
    status(status: number) {
      calls.status = status
      return res
    },
    send(body: unknown) {
      calls.body = body
      return res
    }
  }
  return { res, calls }
}

describe('sendRefusal', () => {
  it('sends the status and message of an HttpError', () => {
    const { res, calls } = response()

    sendRefusal(res, new HttpError(401, 'Invalid Password.'))

    expect(calls).toEqual({ status: 401, body: 'Invalid Password.' })
  })

  it('renders only an HttpError as a client refusal', () => {
    // a plain object carrying a 4xx is some other library's error, not a
    // decision this API made: its message must not reach the caller
    const { res, calls } = response()

    sendRefusal(res, { code: 403, message: 'Invalid clientId.' })

    expect(calls).toEqual({ status: 500, body: 'Internal Server Error' })
  })

  it('does not pass a string code to res.status', () => {
    // Node system errors carry code: 'ENOENT'; res.status('ENOENT') throws
    const { res, calls } = response()

    expect(() =>
      sendRefusal(res, { code: 'ENOENT', message: 'no such file' })
    ).not.toThrow()
    expect(calls).toEqual({ status: 500, body: 'Internal Server Error' })
  })

  it('does not pass a non-HTTP status field to res.status', () => {
    // a driver's own status field is not an HTTP status
    const { res, calls } = response()

    expect(() =>
      sendRefusal(res, { status: 0, message: 'not a status' })
    ).not.toThrow()
    expect(calls).toEqual({ status: 500, body: 'Internal Server Error' })

    const ok = response()
    sendRefusal(ok.res, {
      status: 200,
      message: 'a success where a refusal was expected'
    })
    expect(ok.calls).toEqual({ status: 500, body: 'Internal Server Error' })
  })

  it('sends a fixed body for a 5xx, not the internal message', () => {
    const { res, calls } = response()

    sendRefusal(res, new Error('connect ECONNREFUSED 10.0.0.1:27017'))

    expect(calls).toEqual({ status: 500, body: 'Internal Server Error' })
  })
})
