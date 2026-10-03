/**
 * The Viya client's token lifecycle.
 *
 * The adapter is mocked so the test controls what the compute API answers, and
 * the token mint goes through fetch, which is stubbed to answer the password
 * grant. Both are needed: the failure this pins is the cached pair going bad
 * while the process keeps running.
 */
const mockExecuteScript = jest.fn()

jest.mock('@sasjs/adapter/node', () => ({
  __esModule: true,
  default: class {
    sasViyaApiClient = { executeScript: mockExecuteScript }
  }
}))

import { executeViyaProgram, resetViyaAuth } from '../viyaClient'

const mockFetch = jest.fn()

const tokenResponse = (access: string) => ({
  ok: true,
  json: async () => ({
    access_token: access,
    refresh_token: `${access}-refresh`
  })
})

const run = () => executeViyaProgram('data _null_; run;', 'test-job')

describe('executeViyaProgram token handling', () => {
  beforeAll(() => {
    process.env.VIYA_URL = 'https://viya.example.com'
    process.env.VIYA_USER = 'service-account'
    process.env.VIYA_PASSWORD = 'secret'
    ;(global as any).fetch = mockFetch
  })

  beforeEach(() => {
    resetViyaAuth()
    mockExecuteScript.mockReset()
    mockFetch.mockReset()
    mockFetch.mockResolvedValue(tokenResponse('token-1'))
  })

  it('should mint a token once and reuse it for later jobs', async () => {
    mockExecuteScript.mockResolvedValue({ result: '<html/>', log: 'NOTE: ok' })

    await run()
    await run()

    expect(mockExecuteScript).toHaveBeenCalledTimes(2)
    // The second job runs on the cached token rather than paying for another
    // password grant.
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('should mint again and retry once when the cached token is refused', async () => {
    mockExecuteScript
      .mockRejectedValueOnce({ status: 401, message: 'Unauthorized' })
      .mockResolvedValueOnce({ result: '<html/>', log: 'NOTE: ok' })

    const result = await run()

    expect(result).toEqual({ webout: '<html/>', log: 'NOTE: ok' })
    expect(mockExecuteScript).toHaveBeenCalledTimes(2)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('should retry only once, so a persistent refusal still fails', async () => {
    mockExecuteScript.mockRejectedValue({
      status: 401,
      message: 'Unauthorized'
    })

    await expect(run()).rejects.toMatchObject({ status: 401 })
    expect(mockExecuteScript).toHaveBeenCalledTimes(2)
  })

  it('should not spend a token on a program failure', async () => {
    // A job that fails carries its own log, which the client surfaces as an
    // error with the log attached - a program outcome, not a token problem.
    mockExecuteScript.mockRejectedValue(
      new Error('Error: Job execution failed\nERROR: something broke')
    )

    await expect(run()).rejects.toThrow('Job execution failed')
    expect(mockExecuteScript).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
