import '../api/spec/fetchContextDesktopEnv'
import { mkdirSync, rmSync, writeFileSync } from 'fs'
import path from 'path'
import request from 'supertest'
import { spawnSync } from 'child_process'
import appPromise from '../../app'
import { RunTimeType } from '../../utils'

describe('tier POST parameter collisions', () => {
  const folder = path.join(
    process.cwd(),
    'sasjs_root',
    'drive',
    'files',
    `tier-post-${process.pid}`
  )
  const program = `/tier-post-${process.pid}/capture`
  let app: Awaited<typeof appPromise>
  const oldRunTimes = process.runTimes
  const oldNodeLoc = process.nodeLoc
  const oldPythonLoc = process.pythonLoc
  const python = spawnSync('which', ['python3'], {
    encoding: 'utf8'
  }).stdout.trim()

  beforeAll(async () => {
    app = await appPromise
    process.runTimes = [RunTimeType.JS]
    process.nodeLoc = process.execPath
    mkdirSync(folder, { recursive: true })
    writeFileSync(
      path.join(folder, 'capture.js'),
      `
_webout = JSON.stringify({ params: _sasjs_fetch_context.params,
  region: typeof region === 'undefined' ? null : region,
  Region: typeof Region === 'undefined' ? null : Region,
  program: _program, other: OtherField });`
    )
  })

  afterAll(() => {
    rmSync(folder, { recursive: true, force: true })
    process.runTimes = oldRunTimes
    process.nodeLoc = oldNodeLoc
    process.pythonLoc = oldPythonLoc
  })

  it('makes body values win regardless of case and keeps the executed program identity', async () => {
    const res = await request(app)
      .post(`/StoredProgram?_PROGRAM=${program}&Region=fromQuery`)
      .send({ Region: 'fromBody', _PrOgRaM: '/wrong', OtherField: 'Kept' })
      .expect(200)
    const result = JSON.parse(res.text)
    expect(result.region).toBe('fromBody')
    expect(result.Region).toBeNull()
    expect(result.program).toBe(program)
    expect(result.params).toMatchObject({
      region: 'fromBody',
      _program: program,
      OtherField: 'Kept'
    })
    expect(result.params.Region).toBeUndefined()
    expect(result.params._PrOgRaM).toBeUndefined()
    expect(result.other).toBe('Kept')
  })

  it('merges multipart fields and uploaded files through the real tier', async () => {
    const res = await request(app)
      .post(`/StoredProgram?_PROGRAM=${program}&ReGiOn=query`)
      .field('REGION', 'multipart')
      .field('_PROGRAM', '/wrong')
      .field('OtherField', 'Kept')
      .attach('table', Buffer.from('x\n1'), 'table.csv')
      .expect(200)
    const result = JSON.parse(res.text)
    expect(result.region).toBe('multipart')
    expect(result.program).toBe(program)
    expect(result.params.REGION).toBeUndefined()
    expect(result.params._PROGRAM).toBeUndefined()
    expect(result.other).toBe('Kept')
  })

  ;(python ? it : it.skip)(
    'passes the same merged identity and body value to Python',
    async () => {
      const previous = process.runTimes
      process.runTimes = [RunTimeType.PY]
      process.pythonLoc = python
      const pythonProgram = `/tier-post-${process.pid}/capture-py`
      writeFileSync(
        path.join(folder, 'capture-py.py'),
        `import json\nwith open(_WEBOUT, 'w') as out:\n  json.dump({'region': region, 'program': _program, 'other': OtherField, 'alias': 'Region' in globals()}, out)`
      )
      try {
        const res = await request(app)
          .post(`/StoredProgram?_PROGRAM=${pythonProgram}&Region=query`)
          .send({ Region: 'body', _PROGRAM: '/wrong', OtherField: 'Kept' })
          .expect(200)
        expect(JSON.parse(res.text)).toEqual({
          region: 'body',
          program: pythonProgram,
          other: 'Kept',
          alias: false
        })
      } finally {
        process.runTimes = previous
      }
    }
  )

  it('leaves direct API semantics unchanged even with a spoofed header', async () => {
    const res = await request(app)
      .post(`/SASjsApi/stp/execute?_program=${program}&region=query`)
      .set('tierProgramRequest', 'true')
      .send({ Region: 'body', _program: '/different', OtherField: 'Kept' })
      .expect(200)
    const result = JSON.parse(res.text)
    expect(result.region).toBe('query')
    expect(result.Region).toBe('body')
    expect(result.program).toBe('/different')
  })

  it('makes body _debug win on the tier but keeps the API query precedence', async () => {
    const tier = await request(app)
      .post(`/StoredProgram?_program=${program}&_debug=1`)
      .send({ _DEBUG: '0', OtherField: 'Kept' })
      .expect(200)
    const direct = await request(app)
      .post(`/SASjsApi/stp/execute?_program=${program}&_debug=1`)
      .send({ _DEBUG: '0', OtherField: 'Kept' })
      .expect(200)
    expect(JSON.parse(tier.text).params._debug).toBe('0')
    expect(JSON.parse(direct.text).params._debug).toBe('1')
  })
})
