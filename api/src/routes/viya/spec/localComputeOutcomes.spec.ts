import { createHash } from 'crypto'
import type { Request } from 'express'
import { dispatchViya } from '@sasjs/api'
import { viyaServices } from '../services'
import { executeLocalCompute } from '../localCompute'

const req = { socket: { remoteAddress: '127.0.0.1' } } as Request
const digest = (code: string) => createHash('sha256').update(code).digest('hex')

it('labels static mock rejections through API dispatch', async () => {
  const previous = process.env.LOCAL_VIYA_SCRIPT_MOCKS
  const mode = process.env.MODE
  process.env.LOCAL_VIYA_SCRIPT_MOCKS = '{}'
  process.env.MODE = 'desktop'
  const request = {
    socket: { remoteAddress: '127.0.0.1' },
    get: () => 'local-mock-dispatch.invalid',
    protocol: 'http'
  } as unknown as Request
  const services = viyaServices(request)
  const subject = { userId: 'mock-dispatch-user', clientId: 'mock-client' }
  try {
    const contexts: any = await dispatchViya(
      services,
      'GET',
      '/compute/contexts',
      { subject }
    )
    const session: any = await dispatchViya(
      services,
      'POST',
      `/compute/contexts/${contexts.body.items[0].id}/sessions`,
      { subject, body: {} }
    )
    const base = `/compute/sessions/${session.body.id}/jobs`
    const submitted: any = await dispatchViya(services, 'POST', base, {
      subject,
      body: { code: 'private code' }
    })
    await Promise.resolve()
    const job: any = await dispatchViya(
      services,
      'GET',
      `${base}/${submitted.body.id}`,
      { subject }
    )
    const log: any = await dispatchViya(
      services,
      'GET',
      `${base}/${submitted.body.id}/log/content`,
      { subject }
    )
    expect(job.body.state).toBe('failed')
    expect(log.body.items.map((item: any) => item.line)).toEqual([
      'Mock Compute (not SAS)',
      'Unregistered local script mock.'
    ])
    expect(JSON.stringify(log.body)).not.toContain('private code')
  } finally {
    if (previous === undefined) delete process.env.LOCAL_VIYA_SCRIPT_MOCKS
    else process.env.LOCAL_VIYA_SCRIPT_MOCKS = previous
    if (mode === undefined) delete process.env.MODE
    else process.env.MODE = mode
  }
})

it('uses a generic labelled diagnostic for unexpected static mock exceptions', async () => {
  const { viyaServices } = await import('../services')
  const local = await import('../localCompute')
  const previous = process.env.LOCAL_VIYA_SCRIPT_MOCKS
  process.env.LOCAL_VIYA_SCRIPT_MOCKS = '{}'
  const failure = jest
    .spyOn(local, 'executeLocalCompute')
    .mockRejectedValue(new Error('private code or path'))
  try {
    const request = {
      socket: { remoteAddress: '127.0.0.1' },
      get: () => 'localhost',
      protocol: 'http'
    } as unknown as Request
    await expect(
      viyaServices(request).viya!.execute!({
        program: 'private',
        sessionId: ''
      })
    ).resolves.toEqual({
      state: 'failed',
      log: 'Mock Compute (not SAS)\nLocal script mock failed.'
    })
  } finally {
    failure.mockRestore()
    if (previous === undefined) delete process.env.LOCAL_VIYA_SCRIPT_MOCKS
    else process.env.LOCAL_VIYA_SCRIPT_MOCKS = previous
  }
})

describe('trusted static Compute outcomes', () => {
  const mode = process.env.MODE
  const registry = process.env.LOCAL_VIYA_SCRIPT_MOCKS
  beforeEach(() => {
    process.env.MODE = 'desktop'
  })
  afterEach(() => {
    if (mode === undefined) delete process.env.MODE
    else process.env.MODE = mode
    if (registry === undefined) delete process.env.LOCAL_VIYA_SCRIPT_MOCKS
    else process.env.LOCAL_VIYA_SCRIPT_MOCKS = registry
  })

  it('rejects malformed UTF-16 before hashing while retaining existing UTF-8 digests', async () => {
    const replacement = 'sensitive \ufffd'
    const supplementary = 'sensitive \ud83d\ude00'
    process.env.LOCAL_VIYA_SCRIPT_MOCKS = JSON.stringify({
      [digest(replacement)]: { state: 'completed', log: 'replacement' },
      [digest(supplementary)]: { state: 'completed', log: 'supplementary' }
    })
    for (const code of [
      'sensitive \ud800',
      'sensitive \ud801',
      'sensitive \udc00',
      'sensitive \udfff',
      ['sensitive \ud800'],
      ['sensitive \udc00'],
      'sensitive \ud800\ud800',
      'sensitive \udc00\ud800',
      ['sensitive \ud800', '\udc00'],
      ['\ud83d\ude00', 'sensitive \udfff'],
      'sensitive \ud800x',
      '\ud800sensitive \ufffd'
    ]) {
      if (
        [
          'sensitive \ud800',
          'sensitive \ud801',
          'sensitive \udc00',
          'sensitive \udfff'
        ].includes(Array.isArray(code) ? code.join('\n') : code)
      )
        expect(digest(Array.isArray(code) ? code.join('\n') : code)).toBe(
          digest(replacement)
        )
      await expect(executeLocalCompute(req, code, {})).resolves.toMatchObject({
        state: 'failed',
        log: 'Mock Compute (not SAS)\nInvalid local script mock code.'
      })
    }
    for (const code of [replacement, supplementary, [supplementary]]) {
      await expect(executeLocalCompute(req, code, {})).resolves.toMatchObject({
        state: 'completed'
      })
    }
  })

  it.each([null, -1, 1.5, 2147483648, '4', {}, []])(
    'rejects invalid condition code %p',
    async (jobConditionCode) => {
      const code = 'invalid code fixture'
      process.env.LOCAL_VIYA_SCRIPT_MOCKS = JSON.stringify({
        [digest(code)]: { state: 'error', jobConditionCode, log: 'opaque' }
      })
      await expect(executeLocalCompute(req, code, {})).rejects.toThrow(
        'Unregistered local script mock.'
      )
    }
  )

  it.each(['completed', 'failed', 'warning', 'error'])(
    'accepts %s with omitted and boundary condition codes',
    async (state) => {
      const code = 'valid code fixture'
      for (const jobConditionCode of [undefined, 0, 2147483647]) {
        process.env.LOCAL_VIYA_SCRIPT_MOCKS = JSON.stringify({
          [digest(code)]: { state, jobConditionCode, log: 'opaque' }
        })
        await expect(executeLocalCompute(req, code, {})).resolves.toEqual({
          state,
          ...(jobConditionCode === undefined ? {} : { jobConditionCode }),
          log: 'Mock Compute (not SAS)\nopaque'
        })
      }
    }
  )

  it('refuses a registry larger than its entry bound even for a registered code', async () => {
    const code = 'bounded fixture'
    const mappings: Record<string, unknown> = {
      [digest(code)]: { state: 'completed', log: 'ok' }
    }
    for (let i = 0; i < 256; i++)
      mappings[digest(`extra ${i}`)] = { state: 'failed', log: '' }
    process.env.LOCAL_VIYA_SCRIPT_MOCKS = JSON.stringify(mappings)
    await expect(executeLocalCompute(req, code, {})).rejects.toThrow()
  })

  it('refuses oversized registry text before parsing', async () => {
    const code = 'large registry'
    process.env.LOCAL_VIYA_SCRIPT_MOCKS = JSON.stringify({
      [digest(code)]: {
        state: 'warning',
        log: 'ok',
        extra: 'x'.repeat(4 * 1024 * 1024)
      }
    })
    await expect(executeLocalCompute(req, code, {})).rejects.toThrow()
  })

  it('refuses remote peers, server mode and malformed registry without fallback', async () => {
    const code = 'loopback only'
    process.env.LOCAL_VIYA_SCRIPT_MOCKS = JSON.stringify({
      [digest(code)]: { state: 'warning', log: 'not remote' }
    })
    await expect(
      executeLocalCompute(
        { socket: { remoteAddress: '192.0.2.1' } } as Request,
        code,
        {}
      )
    ).rejects.toThrow()
    process.env.MODE = 'server'
    await expect(executeLocalCompute(req, code, {})).rejects.toThrow()
    process.env.MODE = 'desktop'
    process.env.LOCAL_VIYA_SCRIPT_MOCKS = '{'
    await expect(executeLocalCompute(req, code, {})).rejects.toThrow()
  })

  it('preserves the ordinary SAS execution path when both mock settings are absent', async () => {
    const { viyaServices } = await import('../services')
    const { ExecutionController } =
      await import('../../../controllers/internal')
    const mock = jest
      .spyOn(ExecutionController.prototype, 'executeProgram')
      .mockResolvedValue({
        result: 'real path result',
        log: 'real path log'
      } as any)
    const jobs = process.env.LOCAL_VIYA_JS_JOBS
    const runtimes = process.runTimes
    delete process.env.LOCAL_VIYA_SCRIPT_MOCKS
    delete process.env.LOCAL_VIYA_JS_JOBS
    process.runTimes = []
    try {
      const request = {
        socket: { remoteAddress: '127.0.0.1' },
        headers: {},
        cookies: {},
        get: () => 'localhost',
        protocol: 'http'
      } as unknown as Request
      const run = await viyaServices(request).viya!.execute!({
        program: 'ordinary',
        sessionId: ''
      })
      expect(run).toEqual({ webout: 'real path result', log: 'real path log' })
      expect(mock).toHaveBeenCalledTimes(1)
    } finally {
      mock.mockRestore()
      process.runTimes = runtimes
      if (jobs === undefined) delete process.env.LOCAL_VIYA_JS_JOBS
      else process.env.LOCAL_VIYA_JS_JOBS = jobs
    }
  })

  it('does not fall through from an enabled empty registry to JS twins', async () => {
    const { RunTimeType } = await import('../../../utils')
    const { localComputeCode } = await import('../localJes')
    const twin = process.env.LOCAL_VIYA_JS_JOBS
    const runtimes = process.runTimes
    process.env.LOCAL_VIYA_JS_JOBS = JSON.stringify({ '/mock': '/mock.js' })
    process.env.LOCAL_VIYA_SCRIPT_MOCKS = '{}'
    process.runTimes = [RunTimeType.JS]
    try {
      await expect(
        executeLocalCompute(req, localComputeCode('/mock'), {
          _program: '/mock'
        })
      ).rejects.toThrow('Unregistered local script mock.')
    } finally {
      process.runTimes = runtimes
      if (twin === undefined) delete process.env.LOCAL_VIYA_JS_JOBS
      else process.env.LOCAL_VIYA_JS_JOBS = twin
    }
  })

  it('returns the explicitly registered warning and condition code, never request fields', async () => {
    const code = 'trusted warning fixture'
    process.env.LOCAL_VIYA_SCRIPT_MOCKS = JSON.stringify({
      [digest(code)]: { state: 'warning', jobConditionCode: 4, log: 'opaque' }
    })
    await expect(
      executeLocalCompute(req, code, {
        state: 'completed',
        jobConditionCode: 0,
        log: 'forged'
      })
    ).resolves.toEqual({
      state: 'warning',
      jobConditionCode: 4,
      log: 'Mock Compute (not SAS)\nopaque'
    })
  })
})
