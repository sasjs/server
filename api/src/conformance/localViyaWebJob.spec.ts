import express from 'express'
import cookieParser from 'cookie-parser'
import {
  mkdtemp,
  mkdir,
  rm,
  writeFile,
  copyFile,
  readdir,
  unlink
} from 'fs/promises'
import { spawn } from 'child_process'
import { tmpdir } from 'os'
import { join } from 'path'
import { Server, request as httpRequest } from 'http'
import request from 'supertest'
import SASjs from '@sasjs/adapter/node'
import { ServerType } from '@sasjs/utils/types'
import { configureBodyParsers } from '../app-modules'
import { ModeType, RunTimeType, SECRETS } from '../utils'
import { getSessionController } from '../controllers/internal/Session'
import { ExecutionController } from '../controllers/internal/Execution'
import { SessionState } from '../types'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { UserController } from '../controllers'
import { generateAccessToken, saveTokensInDB } from '../utils'

jest.unmock('axios')

describe('local Viya web jobs', () => {
  let root: string
  let app: express.Express
  let listener: Server
  const saved = {
    root: process.sasjsRoot,
    drive: process.driveLoc,
    logs: process.logsLoc,
    secrets: process.secrets,
    runtimes: process.runTimes,
    node: process.nodeLoc,
    logger: process.logger,
    mode: process.env.MODE,
    emulate: process.env.EMULATE_VIYA
  }
  const trace: {
    method: string
    url: string
    status?: number
    contentType?: string
    contentLength?: string
  }[] = []
  let onResponseClose: (() => void) | undefined
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'local-viya-'))
    process.sasjsRoot = root
    process.driveLoc = join(root, 'drive')
    process.logsLoc = join(root, 'logs')
    process.secrets = SECRETS
    process.runTimes = [RunTimeType.JS]
    process.nodeLoc = process.execPath
    process.logger = { info: () => {}, warn: () => {}, error: () => {} } as any
    process.env.MODE = ModeType.Desktop
    process.env.EMULATE_VIYA = 'true'
    const folder = join(root, 'drive/files/Public/bridge')
    await mkdir(folder, { recursive: true })
    await mkdir(join(root, 'uploads'), { recursive: true })
    await writeFile(
      join(folder, 'capture.js'),
      `_webout = JSON.stringify({program: _program, tables: typeof sasjs_tables === 'undefined' ? null : sasjs_tables, data: typeof sasjs1data === 'undefined' ? null : sasjs1data, count: _WEBIN_FILE_COUNT, upload: _WEBIN_FILE_COUNT ? fs.readFileSync(_WEBIN_FILEREF1, 'utf8') : null})`
    )
    app = express()
    app.use((req, res, next) => {
      const entry = {
        method: req.method,
        url: req.originalUrl,
        status: 0,
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length']
      }
      trace.push(entry)
      res.once('close', () => onResponseClose?.())
      res.once('finish', () => {
        entry.status = res.statusCode
      })
      next()
    })
    app.use(cookieParser())
    configureBodyParsers(app)
    const { setupRoutes } = await import('../routes/setupRoutes')
    setupRoutes(app)
    listener = app.listen(0, '127.0.0.1')
    await new Promise<void>((resolve) => listener.once('listening', resolve))
  })
  afterAll(async () => {
    if (listener)
      await new Promise<void>((resolve) => listener.close(() => resolve()))
    if (root) await rm(root, { recursive: true, force: true })
    process.sasjsRoot = saved.root
    process.driveLoc = saved.drive
    process.logsLoc = saved.logs
    process.secrets = saved.secrets
    process.runTimes = saved.runtimes
    process.nodeLoc = saved.node
    process.logger = saved.logger
    if (saved.mode === undefined) delete process.env.MODE
    else process.env.MODE = saved.mode
    if (saved.emulate === undefined) delete process.env.EMULATE_VIYA
    else process.env.EMULATE_VIYA = saved.emulate
  })
  it.each(['js', 'sas'])(
    'abandons a %s trigger reservation when its resolved program disappears',
    async (runtime) => {
      const runTime = runtime === 'js' ? RunTimeType.JS : RunTimeType.SAS
      const programPath = join(
        root,
        `drive/files/Public/bridge/vanish.${runtime}`
      )
      await writeFile(programPath, 'test')
      const controller = getSessionController(runTime) as any
      const oldRuntimes = process.runTimes
      process.runTimes = [runTime]
      let child: ReturnType<typeof spawn> | undefined
      let reserved: any
      let readySpy: jest.SpyInstance | undefined
      if (runtime === 'sas') {
        child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
          stdio: 'ignore'
        })
        reserved = {
          id: `parked-${Date.now()}`,
          path: join(root, 'sessions', `parked-${Date.now()}`),
          owner: 'test',
          state: SessionState.pending,
          pid: child.pid,
          creationTimeStamp: String(Date.now()),
          deathTimeStamp: String(Date.now() + 60000)
        }
        await mkdir(reserved.path, { recursive: true })
        controller.sessions.push(reserved)
        readySpy = jest
          .spyOn(controller, 'getReadySessions')
          .mockReturnValue([reserved, reserved, reserved])
      }
      const original = controller.getSession.bind(controller)
      const spy = jest
        .spyOn(controller, 'getSession')
        .mockImplementation(async (username: unknown) => {
          reserved = await original(username)
          await unlink(programPath)
          return reserved
        })
      try {
        const res = await request(app).post(
          '/SASjsApi/stp/trigger?_program=/Public/bridge/vanish.' + runtime
        )
        expect(res.status).toBe(400)
        expect(JSON.stringify(res.body)).not.toContain(programPath)
        expect(reserved.state).toBe(SessionState.failed)
        if (child)
          expect(child.exitCode !== null || child.signalCode !== null).toBe(
            true
          )
        else {
          reserved.deathTimeStamp = String(Date.now() + 20)
          controller.scheduleSessionDestroy(reserved)
          await new Promise((resolve) => setTimeout(resolve, 250))
          expect(controller.getSessionById(reserved.id)).toBeUndefined()
          await expect(readdir(reserved.path)).rejects.toMatchObject({
            code: 'ENOENT'
          })
        }
      } finally {
        spy.mockRestore()
        readySpy?.mockRestore()
        process.runTimes = oldRuntimes
        if (child && child.exitCode === null && child.signalCode === null)
          child.kill('SIGKILL')
      }
    }
  )

  it.each(['web', 'native', 'compute'])(
    'isolates concurrent JES and %s requests at the shared pool',
    async (route) => {
      const folder = join(root, 'drive/files/Public/bridge')
      await writeFile(
        join(folder, 'jes-race.js'),
        `_webout = JSON.stringify({origin: 'JES'})`
      )
      await writeFile(
        join(folder, 'other-race.js'),
        `_webout = JSON.stringify({origin: 'OTHER'})`
      )
      process.env.LOCAL_VIYA_JS_JOBS = JSON.stringify({
        '/Public/bridge/jes-race': '/Public/bridge/jes-race.js',
        '/Public/bridge/other-race': '/Public/bridge/other-race.js'
      })
      let compute: SASjs | undefined
      if (route === 'compute') {
        const address = listener.address()
        if (!address || typeof address === 'string')
          throw new Error('listener unavailable')
        compute = new SASjs({
          serverUrl: `http://127.0.0.1:${address.port}`,
          serverType: ServerType.SasViya,
          appLoc: '/Public/bridge',
          useComputeApi: true
        })
        await compute.request('other-race', null)
      }
      const controller = getSessionController(RunTimeType.JS) as any
      await controller.createSession('test')
      const original = controller.getSession.bind(controller)
      let release!: () => void
      let arrived!: () => void
      const gate = new Promise<void>((resolve) => {
        release = resolve
      })
      const both = new Promise<void>((resolve) => {
        arrived = resolve
      })
      const ids: string[] = []
      const spy = jest
        .spyOn(controller, 'getSession')
        .mockImplementation(async (username: unknown) => {
          const session = await original(username)
          ids.push(session.id)
          if (ids.length === 2) arrived()
          await gate
          return session
        })
      try {
        const selector = '/Public/bridge/jes-race'
        const jes = request(app)
          .post('/jobExecution/jobs')
          .send({
            jobDefinition: { id: Buffer.from(selector).toString('base64url') },
            arguments: { _program: selector, _webin_file_count: '0' }
          })
          .then((response) => response)
        const other: Promise<any> = compute
          ? compute.request('other-race', null)
          : request(app)
              .post(
                `${route === 'web' ? '/SASJobExecution/' : '/StoredProgram'}?_program=/Public/bridge/other-race`
              )
              .field('input', 'test')
              .then((response) => response)
        await Promise.race([
          both,
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error('acquisitions did not arrive')),
              10000
            ).unref()
          )
        ])
        release()
        const [jesResponse, otherResponse] = await Promise.all([jes, other])
        expect(new Set(ids).size).toBe(2)
        expect(jesResponse.status).toBe(201)
        if (route !== 'compute') expect(otherResponse.status).toBe(200)
        const result = await request(app)
          .get(`/jobExecution/jobs/${jesResponse.body.id}/result/content`)
          .expect(200)
        expect(JSON.parse(result.text)).toEqual({ origin: 'JES' })
        expect(
          route === 'compute' ? otherResponse : JSON.parse(otherResponse.text)
        ).toEqual({ origin: 'OTHER' })
      } finally {
        release()
        spy.mockRestore()
        delete process.env.LOCAL_VIYA_JS_JOBS
      }
    },
    30000
  )
  it('runs registered compute mock with inline data and refuses altered code', async () => {
    process.env.LOCAL_VIYA_JS_JOBS = JSON.stringify({
      '/Public/bridge/capture': '/Public/bridge/capture.js'
    })
    try {
      const address = listener.address()
      if (!address || typeof address === 'string')
        throw new Error('listener unavailable')
      const client = new SASjs({
        serverUrl: `http://127.0.0.1:${address.port}`,
        serverType: ServerType.SasViya,
        appLoc: '/Public/bridge',
        useComputeApi: true,
        debug: true
      })
      const response: any = await client.request(
        'capture',
        { input: [{ value: 'alpha' }] },
        {},
        undefined,
        undefined,
        ['log']
      )
      expect(response.data).toContain('alpha')
      expect(client.getSasRequests()[0].logFile).toContain('JS mock (not SAS)')
      const folder = await request(app)
        .get('/folders/folders/@item?path=/Public/bridge')
        .expect(200)
      const members = await request(app)
        .get(`/folders/folders/${folder.body.id}/members?limit=500`)
        .expect(200)
      const definition = members.body.items.find(
        (item: any) => item.name === 'capture'
      )
      expect(definition.code).toBeTruthy()
      const uploaded: any = await client.request('capture', {
        input: [{ value: 'alpha;beta' }]
      })
      expect(uploaded.upload).toContain('alpha;beta')
    } finally {
      delete process.env.LOCAL_VIYA_JS_JOBS
    }
  }, 30000)
  it('never executes altered code, mismatched selectors, missing uploads, or an escaped twin', async () => {
    const { executeLocalCompute } = await import('../routes/viya/localCompute')
    const { localComputeCode } = await import('../routes/viya/localJes')
    const fs = await import('fs/promises')
    const marker = join(root, 'executed')
    const folder = join(root, 'drive/files/Public/bridge')
    await writeFile(
      join(folder, 'guard.js'),
      `fs.writeFileSync(${JSON.stringify(marker)}, 'ran')`
    )
    process.env.LOCAL_VIYA_JS_JOBS = JSON.stringify({
      '/Public/bridge/guard': '/Public/bridge/guard.js',
      '/Public/bridge/escape': '/Public/bridge/link.js'
    })
    const req = {} as express.Request
    const code = localComputeCode('/Public/bridge/guard')
    try {
      await expect(
        executeLocalCompute(req, [code, `x`], {
          _program: '/Public/bridge/guard'
        })
      ).rejects.toThrow()
      await expect(
        executeLocalCompute(req, [code], { _program: '/Public/bridge/other' })
      ).rejects.toThrow()
      await expect(
        executeLocalCompute(req, [code], {
          _program: '/Public/bridge/guard',
          _webin_file_count: 1,
          _webin_fileuri1: '/files/files/aaaaaaaa',
          _webin_name1: 'areas'
        })
      ).rejects.toThrow()
      const outside = join(root, 'outside.js')
      await writeFile(
        outside,
        `fs.writeFileSync(${JSON.stringify(marker)}, 'escaped')`
      )
      await fs.symlink(outside, join(folder, 'link.js'))
      await expect(
        executeLocalCompute(req, [localComputeCode('/Public/bridge/escape')], {
          _program: '/Public/bridge/escape'
        })
      ).rejects.toThrow()
      await expect(fs.stat(marker)).rejects.toMatchObject({ code: 'ENOENT' })
    } finally {
      delete process.env.LOCAL_VIYA_JS_JOBS
    }
  })
  it('discovers an explicitly registered local JS JES definition', async () => {
    process.env.LOCAL_VIYA_JS_JOBS = JSON.stringify({
      '/Public/bridge/capture': '/Public/bridge/capture.js'
    })
    try {
      const folder = await request(app)
        .get('/folders/folders/@item?path=/Public/bridge')
        .expect(200)
      const members = await request(app)
        .get(`/folders/folders/${folder.body.id}/members?limit=500`)
        .expect(200)
      const job = members.body.items.find(
        (item: any) => item.name === 'capture'
      )
      expect(
        job.links.find((link: any) => link.rel === 'getResource').href
      ).toMatch(/^\/jobDefinitions\/definitions\//)
    } finally {
      delete process.env.LOCAL_VIYA_JS_JOBS
    }
  })
  it('executes registered JES JS jobs with adapter tables and logs', async () => {
    process.env.LOCAL_VIYA_JS_JOBS = JSON.stringify({
      '/Public/bridge/capture': '/Public/bridge/capture.js'
    })
    try {
      const address = listener.address()
      if (!address || typeof address === 'string')
        throw new Error('listener unavailable')
      const client = new SASjs({
        serverUrl: `http://127.0.0.1:${address.port}`,
        serverType: ServerType.SasViya,
        appLoc: '/Public/bridge',
        useComputeApi: false,
        debug: true
      })
      const result: any = await client.request(
        'capture',
        { input: [{ value: 'hello' }] },
        {},
        undefined,
        undefined,
        ['log']
      )
      expect(result.result.program).toBe('/Public/bridge/capture')
      expect(result.result.count).toBe(1)
      expect(result.result.upload).toContain('hello')
      expect(typeof result.log).toBe('string')
    } finally {
      delete process.env.LOCAL_VIYA_JS_JOBS
    }
  }, 30000)
  it('passes JES string arguments safely alongside uploaded tables', async () => {
    const selector = '/Public/bridge/arguments'
    process.env.LOCAL_VIYA_JS_JOBS = JSON.stringify({
      [selector]: '/Public/bridge/arguments.js'
    })
    await writeFile(
      join(root, 'drive/files/Public/bridge/arguments.js'),
      `_webout = JSON.stringify({ region: typeof region === 'undefined' ? null : region, special: typeof special === 'undefined' ? null : special, program: _program, debug: _debug, count: _WEBIN_FILE_COUNT, upload: fs.readFileSync(_WEBIN_FILEREF1, 'utf8') })`
    )
    try {
      const upload = await request(app)
        .post('/files/files')
        .set('Content-Type', 'application/json')
        .send('value:$char8.\nhello')
        .expect(201)
      const submitted = await request(app)
        .post('/jobExecution/jobs?_action=wait')
        .send({
          jobDefinition: { id: Buffer.from(selector).toString('base64url') },
          arguments: {
            _program: selector,
            _DEBUG: '131',
            _webin_file_count: '1',
            _webin_fileuri1: `/files/files/${upload.body.id}`,
            _webin_name1: 'input',
            region: 'Adak',
            special: 'quote " backtick ` and ${notCode}\\nnext'
          }
        })
        .expect(201)
      const output = await request(app)
        .get(`/jobExecution/jobs/${submitted.body.id}/result/content`)
        .expect(200)
      expect(JSON.parse(output.text)).toEqual({
        region: 'Adak',
        special: 'quote " backtick ` and ${notCode}\\nnext',
        program: selector,
        debug: '131',
        count: 1,
        upload: 'value:$char8.\nhello'
      })
    } finally {
      delete process.env.LOCAL_VIYA_JS_JOBS
    }
  }, 30000)
  it.each([
    { region: { nested: 'Adak' } },
    { 'bad-name': 'Adak' },
    { _webin_filename1: 'spoof' },
    { _PROGRAM: '/Public/bridge/other' }
  ])(
    'rejects unsupported JES arguments rather than dropping them: %j',
    async (extra) => {
      const selector = '/Public/bridge/capture'
      process.env.LOCAL_VIYA_JS_JOBS = JSON.stringify({
        [selector]: '/Public/bridge/capture.js'
      })
      try {
        await request(app)
          .post('/jobExecution/jobs')
          .send({
            jobDefinition: { id: Buffer.from(selector).toString('base64url') },
            arguments: { _program: selector, _webin_file_count: '0', ...extra }
          })
          .expect(400)
      } finally {
        delete process.env.LOCAL_VIYA_JS_JOBS
      }
    }
  )
  it.each(['web', 'jes', 'compute'])(
    'does not claim arbitrary adapter request config reaches %s',
    async (mode) => {
      const selector = '/Public/bridge/config-argument'
      await writeFile(
        join(root, 'drive/files/Public/bridge/config-argument.js'),
        `_webout = JSON.stringify({region: typeof region === 'undefined' ? null : region})`
      )
      if (mode !== 'web')
        process.env.LOCAL_VIYA_JS_JOBS = JSON.stringify({
          [selector]: '/Public/bridge/config-argument.js'
        })
      try {
        const address = listener.address()
        if (!address || typeof address === 'string')
          throw new Error('listener unavailable')
        const client = new SASjs({
          serverUrl: `http://127.0.0.1:${address.port}`,
          serverType: ServerType.SasViya,
          appLoc: '/Public/bridge',
          ...(mode === 'web' ? {} : { useComputeApi: mode === 'compute' })
        })
        const result = await client.request('config-argument', null, {
          region: 'Adak'
        })
        expect(result.region).toBeNull()
      } finally {
        delete process.env.LOCAL_VIYA_JS_JOBS
      }
    },
    30000
  )
  it('refuses an unregistered selector and reports a failed JS twin', async () => {
    process.env.LOCAL_VIYA_JS_JOBS = JSON.stringify({
      '/Public/bridge/broken': '/Public/bridge/broken.js'
    })
    await writeFile(
      join(root, 'drive/files/Public/bridge/broken.js'),
      `throw new Error('mock failure')`
    )
    try {
      await request(app)
        .post('/jobExecution/jobs')
        .send({
          jobDefinition: { id: 'spoof' },
          arguments: {
            _program: '/Public/bridge/capture',
            _webin_file_count: '0'
          }
        })
        .expect(400)
      const address = listener.address()
      if (!address || typeof address === 'string')
        throw new Error('listener unavailable')
      const client = new SASjs({
        serverUrl: `http://127.0.0.1:${address.port}`,
        serverType: ServerType.SasViya,
        appLoc: '/Public/bridge',
        useComputeApi: false,
        debug: true
      })
      await expect(client.request('broken', null)).rejects.toBeDefined()
    } finally {
      delete process.env.LOCAL_VIYA_JS_JOBS
    }
  }, 30000)
  it('keeps raw mock uploads opt-in and rejects malformed registrations', async () => {
    delete process.env.LOCAL_VIYA_JS_JOBS
    await request(app)
      .post('/files/files')
      .set('Content-Type', 'application/json')
      .send('"raw"')
      .expect(400)
    process.env.LOCAL_VIYA_JS_JOBS = JSON.stringify({
      '/Public/bridge/escape': '/Public/bridge/../capture.js',
      '/Public/bridge/sas': '/Public/bridge/capture.sas'
    })
    try {
      const folder = await request(app)
        .get('/folders/folders/@item?path=/Public/bridge')
        .expect(200)
      const members = await request(app)
        .get(`/folders/folders/${folder.body.id}/members?limit=500`)
        .expect(200)
      expect(
        members.body.items.some((item: any) => item.type === 'jobDefinition')
      ).toBe(false)
      await request(app)
        .post('/jobExecution/jobs')
        .send({
          jobDefinition: { id: 'x' },
          arguments: { _program: '/Public/bridge/escape' }
        })
        .expect(400)
    } finally {
      delete process.env.LOCAL_VIYA_JS_JOBS
    }
  })
  it('executes a fresh adapter null, inline and file request', async () => {
    const address = listener.address()
    if (!address || typeof address === 'string')
      throw new Error('listener unavailable')
    const run = async (data: any) => {
      const client = new SASjs({
        serverUrl: `http://127.0.0.1:${address.port}`,
        serverType: ServerType.SasViya,
        appLoc: '/Public/bridge',
        debug: false
      })
      trace.length = 0
      const result = await client.request('capture', data)
      expect(trace.map((x) => x.method)).toEqual(['GET', 'GET', 'POST'])
      expect(
        trace.every((x) => x.status && x.status >= 200 && x.status < 300)
      ).toBe(true)
      return result
    }
    const empty = await run(null)
    expect(trace[2].contentType).toMatch(/^multipart\/form-data;\s*boundary=/i)
    expect(trace[2].contentLength).toBe('0')
    expect(empty.program).toBe('/Public/bridge/capture')
    expect(empty.count).toBe(0)
    const inline = await run({ input: [{ value: 'alpha' }] })
    expect(inline.tables).toBe('input')
    expect(inline.data).toContain('alpha')
    const file = await run({ input: [{ value: 'alpha;beta' }] })
    expect(file.count).toBe(1)
    expect(file.upload).toContain('alpha;beta')
  }, 30000)
  it('returns a JS twin result and log to the unchanged Viya web adapter in debug mode', async () => {
    const folder = join(root, 'drive/files/Public/bridge')
    await writeFile(
      join(folder, 'debug.js'),
      `_webout = JSON.stringify({message: 'debug result', debug: _debug, data: typeof sasjs1data === 'undefined' ? null : sasjs1data, upload: _WEBIN_FILE_COUNT ? fs.readFileSync(_WEBIN_FILEREF1, 'utf8') : null}); console.log('debug twin log')`
    )
    const address = listener.address()
    if (!address || typeof address === 'string')
      throw new Error('listener unavailable')
    const client = new SASjs({
      serverUrl: `http://127.0.0.1:${address.port}`,
      serverType: ServerType.SasViya,
      appLoc: '/Public/bridge',
      debug: true
    })
    const run = async (data: any) => {
      trace.length = 0
      const response: any = await client.request(
        'debug',
        data,
        {},
        undefined,
        undefined,
        ['log']
      )
      expect(response.result.message).toBe('debug result')
      expect(String(response.result.debug)).toBe('131')
      if (data?.input?.[0]?.value === 'inline')
        expect(response.result.data).toContain('inline')
      if (data?.input?.[0]?.value === 'file;upload')
        expect(response.result.upload).toContain('file;upload')
      expect(response.log).toContain('debug twin log')
      expect(trace.slice(-2).map((x) => x.method)).toEqual(['POST', 'GET'])
      expect(trace[trace.length - 1].url).toMatch(
        /^\/SASJobExecution\/\?_fileid=/
      )
      expect(trace.every((x) => x.status === 200)).toBe(true)
    }
    await run(null)
    await run({ input: [{ value: 'inline' }] })
    await run({ input: [{ value: 'file;upload' }] })
  }, 30000)
  it('isolates debug output links and escapes the JS log in the HTML page', async () => {
    const folder = join(root, 'drive/files/Public/bridge')
    await writeFile(
      join(folder, 'escape.js'),
      `_webout = JSON.stringify({value: typeof input === 'undefined' ? '' : input}); console.log('<script>alert(1)</script>')`
    )
    const run = (value: string) =>
      request(app)
        .post('/SASJobExecution/?_program=/Public/bridge/escape&_debug=131')
        .field('input', value)
    const [first, second] = await Promise.all([run('first'), run('second')])
    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(first.text).not.toContain('<script>alert(1)</script>')
    expect(first.text).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    const url = (body: string) => {
      const match = body.match(/src=(\/SASJobExecution\/\?_fileid=[^ >]+)/)
      if (!match) throw new Error('Missing captured-style iframe')
      return match[1]
    }
    expect(url(first.text)).not.toBe(url(second.text))
    const firstContent = await request(app).get(url(first.text)).expect(200)
    const secondContent = await request(app).get(url(second.text)).expect(200)
    expect(JSON.parse(firstContent.text)).toEqual({ value: 'first' })
    expect(JSON.parse(secondContent.text)).toEqual({ value: 'second' })
    expect(firstContent.headers['x-sasjs-emulated']).toBeDefined()
    await request(app)
      .get(`${url(first.text)}&_program=ignored`)
      .expect(400)
    process.env.MODE = ModeType.Server
    try {
      await request(app).get(url(first.text)).expect(404)
    } finally {
      process.env.MODE = ModeType.Desktop
    }
    process.env.EMULATE_VIYA = 'false'
    try {
      await request(app).get(url(first.text)).expect(404)
    } finally {
      process.env.EMULATE_VIYA = 'true'
    }
  }, 30000)
  it('rejects unsupported debug levels, body selectors and debug outside desktop', async () => {
    const target = '/SASJobExecution/?_program=/Public/bridge/capture'
    await request(app).post(`${target}&_debug=128`).expect(400)
    await request(app).post(target).field('_debug', '128').expect(400)
    await request(app)
      .post(target)
      .attach('_debug', Buffer.from('131'), 'debug.txt')
      .expect(400)
    process.env.MODE = ModeType.Server
    try {
      await request(app).post(`${target}&_debug=131`).expect(400)
    } finally {
      process.env.MODE = ModeType.Desktop
    }
  })
  it('runs the unchanged seed appinit JS twin with a fresh adapter', async () => {
    const folder = join(
      root,
      'drive/files/Public/app/react-seed-app/services/common'
    )
    await mkdir(folder, { recursive: true })
    for (const file of ['appinit.js', 'springs.json', 'mock-sas-log.json'])
      await copyFile(
        join(__dirname, '../../fixtures/viya-web-job-seed', file),
        join(folder, file)
      )
    const address = listener.address()
    if (!address || typeof address === 'string')
      throw new Error('listener unavailable')
    const client = new SASjs({
      serverUrl: `http://127.0.0.1:${address.port}`,
      serverType: ServerType.SasViya,
      appLoc: '/Public/app/react-seed-app',
      debug: false
    })
    trace.length = 0
    const result = await client.request('services/common/appinit', null)
    expect(result.areas).toHaveLength(197)
    expect(result.areas.some((row: any) => row.AREA === 'Adak')).toBe(true)
    expect(trace.map((x) => x.method)).toEqual(['GET', 'GET', 'POST'])
    expect(
      trace.every((x) => x.status && x.status >= 200 && x.status < 300)
    ).toBe(true)
  }, 30000)
  it('keeps server authentication ahead of execution', async () => {
    const mongo = await MongoMemoryServer.create()
    await mongoose.connect(mongo.getUri())
    process.env.MODE = ModeType.Server
    const controller = getSessionController(RunTimeType.JS) as any
    const spy = jest.spyOn(controller, 'getSession')
    try {
      await request(app)
        .post('/SASJobExecution/?_program=/Public/bridge/capture')
        .expect(401)
      const user = await new UserController().createUser({
        displayName: 'Unprivileged',
        username: 'bridge-user',
        password: 'synthetic-password',
        isAdmin: false,
        isActive: true
      })
      const token = generateAccessToken({
        clientId: 'bridge-test',
        userId: user.uid
      })
      await saveTokensInDB(user.uid, 'bridge-test', token, 'synthetic-refresh')
      await request(app)
        .post('/SASJobExecution/?_program=/Public/bridge/capture')
        .auth(token, { type: 'bearer' })
        .expect(401)
      expect(spy).not.toHaveBeenCalled()
    } finally {
      spy.mockRestore()
      process.env.MODE = ModeType.Desktop
      await mongoose.disconnect()
      await mongo.stop()
    }
  })
  it('does not forward web jobs when emulation is off and retains native POST', async () => {
    process.env.EMULATE_VIYA = 'false'
    try {
      await request(app)
        .post('/SASJobExecution/?_program=/Public/bridge/capture')
        .expect(404)
      const native = await request(app)
        .post('/StoredProgram?_program=/Public/bridge/capture')
        .field('sasjs_tables', 'input')
        .field('sasjs1data', 'native')
      expect(native.status).toBe(200)
      expect(JSON.parse(native.text).data).toBe('native')
    } finally {
      process.env.EMULATE_VIYA = 'true'
    }
  })
  it.each(
    ['/SASJobExecution/', '/StoredProgram', '/SASjsApi/stp/execute'].flatMap(
      (route) => [
        {
          route,
          type: 'multipart/form-data; boundary=abc; nonsense',
          empty: false
        },
        {
          route,
          type: 'multipart/form-data; boundary=abc; charset="broken',
          empty: false
        },
        {
          route,
          type: 'multipart/form-data; boundary=abc; nonsense',
          empty: true
        }
      ]
    )
  )(
    'rejects malformed multipart header $type (empty=$empty) on $route',
    async ({ route, type, empty }) => {
      const marker = join(root, 'multipart-executed')
      await rm(marker, { force: true })
      await writeFile(
        join(root, 'drive/files/Public/bridge/multipart-guard.js'),
        `fs.writeFileSync(${JSON.stringify(marker)}, 'executed'); _webout = '{}'`
      )
      const payload =
        '--abc\r\nContent-Disposition: form-data; name="input"; filename="input.csv"\r\nContent-Type: text/plain\r\n\r\nhello\r\n--abc--\r\n'
      const controller = getSessionController(RunTimeType.JS) as any
      const spy = jest.spyOn(controller, 'getSession')
      try {
        const response = await request(app)
          .post(`${route}?_program=/Public/bridge/multipart-guard`)
          .set('Content-Type', type)
          .send(empty ? '' : payload)
        expect(response.status).toBe(400)
        await expect(
          import('fs/promises').then((fs) => fs.stat(marker))
        ).rejects.toMatchObject({ code: 'ENOENT' })
        expect(spy).not.toHaveBeenCalled()
      } finally {
        spy.mockRestore()
        await rm(marker, { force: true })
      }
    }
  )
  it.each(['/SASJobExecution/', '/StoredProgram', '/SASjsApi/stp/execute'])(
    'delivers a file with quoted multipart parameters on %s',
    async (route) => {
      const payload =
        '--abc\r\nContent-Disposition: form-data; name="input"; filename="input.csv"\r\nContent-Type: text/plain\r\n\r\nhello\r\n--abc--\r\n'
      for (const type of [
        'multipart/form-data; boundary="abc"; note="a;b"',
        'multipart/form-data; note="a\\\"b"; boundary=abc'
      ]) {
        const response = await request(app)
          .post(`${route}?_program=/Public/bridge/capture`)
          .set('Content-Type', type)
          .send(payload)
        expect(response.status).toBe(200)
        expect(JSON.parse(response.text)).toMatchObject({
          count: 1,
          upload: 'hello'
        })
      }
    }
  )
  it('cleans up a reservation after malformed multipart', async () => {
    const controller = getSessionController(RunTimeType.JS) as any
    const spy = jest.spyOn(controller, 'getSession')
    await request(app)
      .post('/SASJobExecution/?_program=/Public/bridge/capture')
      .set('Content-Type', 'multipart/form-data; boundary=bad')
      .send('--bad\r\n')
      .expect(400)
    expect(spy).toHaveBeenCalledTimes(1)
    const session = await spy.mock.results[0].value
    expect(session.state).not.toBe(SessionState.running)
    spy.mockRestore()
  })
  it('rejects a zero-byte multipart request without a boundary', async () => {
    const controller = getSessionController(RunTimeType.JS) as any
    const spy = jest.spyOn(controller, 'getSession')
    try {
      await request(app)
        .post('/SASJobExecution/?_program=/Public/bridge/capture')
        .set('Content-Type', 'multipart/form-data; charset=utf-8')
        .set('Content-Length', '0')
        .expect(400)
      expect(spy).not.toHaveBeenCalled()
    } finally {
      spy.mockRestore()
    }
  })
  it('releases a JS reservation if the uploader disconnects', async () => {
    const controller = getSessionController(RunTimeType.JS) as any
    const spy = jest.spyOn(controller, 'getSession')
    const address = listener.address()
    if (!address || typeof address === 'string')
      throw new Error('listener unavailable')
    try {
      await new Promise<void>((resolve, reject) => {
        const req = httpRequest({
          host: '127.0.0.1',
          port: address.port,
          path: '/SASJobExecution/?_program=/Public/bridge/capture',
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data; boundary=test',
            'Content-Length': '10000'
          }
        })
        req.on('error', () => resolve())
        req.on('response', () => reject(new Error('unexpected response')))
        req.write(
          '--test\r\nContent-Disposition: form-data; name="input"; filename="input.csv"\r\nContent-Type: text/csv\r\n\r\npartial'
        )
        const interval = setInterval(() => {
          if (spy.mock.results.length) {
            clearInterval(interval)
            req.destroy()
          }
        }, 10)
      })
      const session = await spy.mock.results[0].value
      await new Promise((resolve) => setTimeout(resolve, 200))
      expect(session.state).not.toBe(SessionState.running)
      expect(
        (await readdir(session.path)).filter((name) =>
          name.startsWith('req_file_')
        )
      ).toEqual([])
    } finally {
      spy.mockRestore()
    }
  }, 30000)
  it('releases a reservation when the response closes after a complete upload', async () => {
    const controller = getSessionController(RunTimeType.JS) as any
    const executeSpy = jest.spyOn(ExecutionController.prototype, 'executeFile')
    const original = controller.getSession.bind(controller)
    let release!: () => void
    let entered!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const started = new Promise<void>((resolve) => {
      entered = resolve
    })
    const serverClosed = new Promise<void>((resolve) => {
      onResponseClose = resolve
    })
    let session: any
    const spy = jest
      .spyOn(controller, 'getSession')
      .mockImplementation(async (username: unknown) => {
        session = await original(username)
        entered()
        await gate
        return session
      })
    const address = listener.address()
    if (!address || typeof address === 'string')
      throw new Error('listener unavailable')
    try {
      const req = httpRequest({
        host: '127.0.0.1',
        port: address.port,
        path: '/SASJobExecution/?_program=/Public/bridge/capture',
        method: 'POST',
        headers: { 'Content-Length': '0' }
      })
      const closed = new Promise<void>((resolve) =>
        req.on('error', () => resolve())
      )
      req.end()
      await started
      req.destroy()
      await closed
      await serverClosed
      release()
      await new Promise((resolve) => setTimeout(resolve, 200))
      expect(session.state).not.toBe(SessionState.running)
      expect(executeSpy).not.toHaveBeenCalled()
    } finally {
      release()
      onResponseClose = undefined
      spy.mockRestore()
      executeSpy.mockRestore()
    }
  }, 30000)
  it('removes uploaded parts and releases the session when a body selector is refused', async () => {
    const controller = getSessionController(RunTimeType.JS) as any
    const spy = jest.spyOn(controller, 'getSession')
    try {
      await request(app)
        .post('/SASJobExecution/?_program=/Public/bridge/capture')
        .attach('input', Buffer.from('sensitive'), 'input.csv')
        .field('_program', '/Public/bridge/other')
        .expect(400)
      const session = await spy.mock.results[0].value
      expect(session.state).not.toBe(SessionState.running)
      expect(
        (await readdir(session.path)).filter((name) =>
          name.startsWith('req_file_')
        )
      ).toEqual([])
    } finally {
      spy.mockRestore()
    }
  })
})
