import { createHash } from 'crypto'
import type { Request } from 'express'
import { dispatchViya } from '@sasjs/api'
import { viyaServices } from '../services'
import { executeLocalCompute } from '../localCompute'
import { RunTimeType } from '../../../utils'

// Uses the real Server execution port and the installed API dispatcher.
// No listener, authentication or SAS runtime is involved.
test('interleaved registered jobs retain trusted outcomes, codes and paged logs', async () => {
  const saved = {
    mode: process.env.MODE,
    registry: process.env.LOCAL_VIYA_SCRIPT_MOCKS,
    url: process.env.API_SERVER_URL,
    runtimes: process.runTimes
  }
  process.env.MODE = 'desktop'
  process.env.API_SERVER_URL = 'http://server-outcomes.invalid'
  const entries = [
    {
      code: 'warning fixture',
      state: 'warning',
      jobConditionCode: 4,
      log: 'warning log\nsecond line'
    },
    {
      code: 'error fixture',
      state: 'error',
      jobConditionCode: 12,
      log: 'error log\nsecond line'
    },
    {
      code: 'completed fixture',
      state: 'completed',
      log: 'ERROR: opaque text'
    },
    { code: 'failed fixture', state: 'failed', log: 'opaque failure' }
  ]
  const emptyDigest = createHash('sha256').update('').digest('hex')
  process.env.LOCAL_VIYA_SCRIPT_MOCKS = JSON.stringify({
    [emptyDigest]: {
      state: 'warning',
      jobConditionCode: 4,
      log: 'empty must never run'
    },
    ...Object.fromEntries(
      entries.map(({ code, ...result }) => [
        createHash('sha256').update(code).digest('hex'),
        result
      ])
    )
  })
  const req = {
    protocol: 'http',
    get: () => 'localhost',
    socket: { remoteAddress: '127.0.0.1' }
  } as unknown as Request
  const services = viyaServices(req)
  process.runTimes = [RunTimeType.JS]
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const actualExecute = services.viya!.execute!
  services.viya!.execute = async (request) => {
    if (request.program === 'warning fixture') await gate
    return actualExecute(request)
  }
  const subject = { userId: 'alice', ownerId: 'alice-id', clientId: 'client' }
  const foreign = { ...subject, ownerId: 'bob-id' }
  try {
    const contexts: any = await dispatchViya(
      services,
      'GET',
      '/compute/contexts',
      { subject }
    )
    expect(contexts.status).toBe(200)
    const session: any = await dispatchViya(
      services,
      'POST',
      `/compute/contexts/${contexts.body.items[0].id}/sessions`,
      { subject, body: {} }
    )
    expect(session.status).toBe(201)
    const base = `/compute/sessions/${session.body.id}/jobs`
    const jobs = await Promise.all(
      entries.map(async (entry) => {
        const result: any = await dispatchViya(services, 'POST', base, {
          subject,
          body: {
            code: entry.code,
            state: 'completed',
            jobConditionCode: 99,
            log: 'forged',
            variables: {
              state: 'completed',
              jobConditionCode: '99',
              log: 'forged'
            }
          }
        })
        expect(result.status).toBe(201)
        return `${base}/${result.body.id}`
      })
    )
    const refused: any = await dispatchViya(services, 'POST', base, {
      subject,
      body: {
        code: 'unknown code',
        state: 'warning',
        jobConditionCode: 4,
        log: 'forged'
      }
    })
    expect(refused.status).toBe(201)
    await Promise.resolve()
    const running: any = await dispatchViya(services, 'GET', jobs[0], {
      subject
    })
    const finished: any = await dispatchViya(services, 'GET', jobs[1], {
      subject
    })
    expect(running.body).toMatchObject({
      state: 'running',
      jobConditionCode: 0
    })
    expect(finished.body).toMatchObject({
      state: 'error',
      jobConditionCode: 12
    })
    release()
    for (let attempt = 0; attempt < 20; attempt++) {
      const current: any = await dispatchViya(services, 'GET', jobs[0], {
        subject
      })
      if (current.body.state !== 'running') break
      await new Promise((resolve) => setImmediate(resolve))
    }
    for (let i = 0; i < jobs.length; i++) {
      const path = jobs[i]
      const result: any = await dispatchViya(services, 'GET', path, {
        subject
      })
      expect(result.body).toMatchObject({
        state: entries[i].state,
        jobConditionCode: entries[i].jobConditionCode ?? 0
      })
      const first: any = await dispatchViya(services, 'GET', `${path}/log`, {
        subject,
        query: { start: '0', limit: '1' }
      })
      const second: any = await dispatchViya(services, 'GET', `${path}/log`, {
        subject,
        query: { start: '1', limit: '10' }
      })
      expect(
        [...first.body.items, ...second.body.items].map(
          (line: any) => line.line
        )
      ).toEqual(['Mock Compute (not SAS)', ...entries[i].log.split('\n')])
      expect(
        (await dispatchViya(services, 'GET', path, { subject: foreign })).status
      ).toBe(404)
    }
    const rejected: any = await dispatchViya(
      services,
      'GET',
      `${base}/${refused.body.id}`,
      { subject }
    )
    expect(rejected.body.state).toBe('failed')
    expect(rejected.body.jobConditionCode).toBe(0)
    const log: any = await dispatchViya(
      services,
      'GET',
      `${base}/${refused.body.id}/log/content`,
      { subject }
    )
    expect(JSON.stringify(log.body)).not.toContain('forged')
    expect(log.body.items.map((line: any) => line.line)).toEqual([
      'Mock Compute (not SAS)',
      'Unregistered local script mock.'
    ])
    for (const code of ['', [], [''], undefined]) {
      const empty: any = await dispatchViya(services, 'POST', base, {
        subject,
        body: { code, state: 'warning', jobConditionCode: 4 }
      })
      expect(empty.status).toBe(201)
      await Promise.resolve()
      let job: any
      for (let attempt = 0; attempt < 20; attempt++) {
        job = await dispatchViya(services, 'GET', `${base}/${empty.body.id}`, {
          subject
        })
        if (job.body.state !== 'running') break
        await new Promise((resolve) => setImmediate(resolve))
      }
      expect(job.body).toMatchObject({ state: 'failed', jobConditionCode: 0 })
      const emptyLog: any = await dispatchViya(
        services,
        'GET',
        `${base}/${empty.body.id}/log`,
        { subject }
      )
      expect(emptyLog.body.items.map((line: any) => line.line)).toEqual([
        'Mock Compute (not SAS)',
        'Invalid local script mock code.'
      ])
    }
    process.env.LOCAL_VIYA_SCRIPT_MOCKS = '{'
    const invalid: any = await dispatchViya(services, 'POST', base, {
      subject,
      body: { code: 'private registry input' }
    })
    await Promise.resolve()
    const invalidLog: any = await dispatchViya(
      services,
      'GET',
      `${base}/${invalid.body.id}/log`,
      { subject }
    )
    expect(invalidLog.body.items.map((line: any) => line.line)).toEqual([
      'Mock Compute (not SAS)',
      'Invalid local script mock registry.'
    ])
    expect(JSON.stringify(invalidLog.body)).not.toContain(
      'private registry input'
    )
    const secret = 'private-code-'
    const replacement = `${secret}\ufffd`
    const happyArray = ['line 😀', 'next']
    process.env.LOCAL_VIYA_SCRIPT_MOCKS = JSON.stringify({
      [createHash('sha256').update(replacement).digest('hex')]: {
        state: 'completed',
        log: 'replacement fixture'
      },
      [createHash('sha256').update(happyArray.join('\n')).digest('hex')]: {
        state: 'warning',
        log: 'array fixture'
      }
    })
    for (const code of [
      `${secret}\ud800`,
      `${secret}\ud801`,
      `${secret}\udc00`,
      [`${secret}\udfff`],
      [`${secret}\ud800`, '\udc00']
    ]) {
      const submitted: any = await dispatchViya(services, 'POST', base, {
        subject,
        body: { code }
      })
      expect(submitted.status).toBe(201)
      const path = `${base}/${submitted.body.id}`
      let job: any
      for (let attempt = 0; attempt < 20; attempt++) {
        job = await dispatchViya(services, 'GET', path, { subject })
        if (job.body.state !== 'running') break
        await new Promise((resolve) => setImmediate(resolve))
      }
      expect(job.body.state).toBe('failed')
      for (const suffix of ['/log', '/log/content']) {
        const result: any = await dispatchViya(services, 'GET', path + suffix, {
          subject
        })
        expect(result.body.items.map((line: any) => line.line)).toEqual([
          'Mock Compute (not SAS)',
          'Invalid local script mock code.'
        ])
        expect(JSON.stringify(result.body)).not.toContain(secret)
      }
    }
    for (const [code, state] of [
      [replacement, 'completed'],
      [happyArray, 'warning']
    ] as const) {
      const submitted: any = await dispatchViya(services, 'POST', base, {
        subject,
        body: { code }
      })
      await Promise.resolve()
      const job: any = await dispatchViya(
        services,
        'GET',
        `${base}/${submitted.body.id}`,
        { subject }
      )
      expect(job.body.state).toBe(state)
    }
    delete process.env.LOCAL_VIYA_SCRIPT_MOCKS
    await expect(executeLocalCompute(req, 'unregistered', {})).rejects.toThrow()
  } finally {
    release()
    process.runTimes = saved.runtimes
    for (const [key, value] of Object.entries({
      MODE: saved.mode,
      LOCAL_VIYA_SCRIPT_MOCKS: saved.registry,
      API_SERVER_URL: saved.url
    })) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})
