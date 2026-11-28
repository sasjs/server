import { mkdtemp, mkdir, readFile, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import type { Request } from 'express'
import { dispatchViya } from '@sasjs/api'
import { executeLocalCompute } from '../localCompute'
import { serverDrive, viyaServices } from '../services'
import { ExecutionController } from '../../../controllers/internal'
import { ModeType, RunTimeType, SECRETS } from '../../../utils'
import * as authorization from '../../../middlewares/authorize'

it('runs only the registered JS twin for a deployed definition and its matching code', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'persisted-twin-'))
  const saved = {
    root: process.sasjsRoot,
    drive: process.driveLoc,
    logs: process.logsLoc,
    secrets: process.secrets,
    runtimes: process.runTimes,
    node: process.nodeLoc,
    logger: process.logger,
    mode: process.env.MODE,
    jobs: process.env.LOCAL_VIYA_JS_JOBS,
    scripts: process.env.LOCAL_VIYA_SCRIPT_MOCKS
  }
  process.sasjsRoot = root
  process.driveLoc = path.join(root, 'drive')
  process.logsLoc = path.join(root, 'logs')
  process.secrets = SECRETS
  process.runTimes = [RunTimeType.JS]
  process.nodeLoc = process.execPath
  process.logger = { info: () => {}, warn: () => {}, error: () => {} } as any
  process.env.MODE = ModeType.Desktop
  process.env.LOCAL_VIYA_JS_JOBS = JSON.stringify({
    '/folder/job': '/folder/job.js'
  })
  delete process.env.LOCAL_VIYA_SCRIPT_MOCKS
  const req = {
    headers: {},
    cookies: {},
    protocol: 'http',
    get: () => 'localhost',
    user: { isAdmin: true }
  } as unknown as Request
  const spy = jest.spyOn(ExecutionController.prototype, 'executeProgram')
  try {
    const folder = path.join(root, 'drive/files/folder')
    await mkdir(folder, { recursive: true })
    await writeFile(
      path.join(folder, 'job.js'),
      `_webout = JSON.stringify({ input: input })`
    )
    const marker = path.join(root, 'sas-was-executed')
    const code = `%put persisted;\r\nx 'touch ${marker}';\r\nrun;`
    const drive = serverDrive()
    const services: any = {
      drive,
      viya: { allowUntransactionalJobDefinitionCreation: true }
    }
    const parent: any = await dispatchViya(
      services,
      'GET',
      '/folders/folders/@item',
      { query: { path: '/folder' } }
    )
    expect(parent.status).toBe(200)
    const created: any = await dispatchViya(
      services,
      'POST',
      '/jobDefinitions/definitions',
      {
        query: { parentFolderUri: `/folders/folders/${parent.body.id}` },
        body: { name: 'job', type: 'Compute', code, parameters: [] }
      }
    )
    expect(created.status).toBe(201)
    const definition: any = await dispatchViya(
      services,
      'GET',
      `/jobDefinitions/definitions/${created.body.id}`
    )
    expect(definition.body).toEqual(created.body)
    const normalized = code.replace(/\r\n/g, '\n').split('\n')
    const first = await executeLocalCompute(req, normalized, {
      _program: '/folder/job',
      input: 'alpha'
    })
    const second = await executeLocalCompute(req, normalized, {
      _program: '/folder/job',
      input: 'beta'
    })
    expect(JSON.parse(first.webout!)).toEqual({ input: 'alpha' })
    expect(JSON.parse(second.webout!)).toEqual({ input: 'beta' })
    expect(first.log).toContain('JS mock (not SAS)')
    expect(spy).toHaveBeenCalledTimes(2)
    expect(
      spy.mock.calls.every(([args]) => args.runTime === RunTimeType.JS)
    ).toBe(true)
    const recordPath = path.join(
      folder,
      `.sasjs-viya-job-${definition.body.id}.json`
    )
    await writeFile(
      recordPath,
      JSON.stringify({ ...definition.body, code: '%put changed;' })
    )
    await expect(
      executeLocalCompute(req, normalized, { _program: '/folder/job' })
    ).rejects.toThrow()
    await writeFile(recordPath, JSON.stringify(definition.body))
    for (const denied of [
      '/SASjsApi/drive/file',
      '/SASjsApi/drive/fileTree',
      '/SASjsApi/drive/folder'
    ]) {
      const access = jest
        .spyOn(authorization, 'hasRoutePermission')
        .mockImplementation(async (request: Request) => request.url !== denied)
      try {
        await expect(
          executeLocalCompute(req, normalized, { _program: '/folder/job' })
        ).rejects.toThrow('Definition access denied')
      } finally {
        access.mockRestore()
      }
    }
    await expect(
      executeLocalCompute(req, ['unknown'], { _program: '/folder/job' })
    ).rejects.toThrow()
    await expect(
      executeLocalCompute(req, normalized, { _program: '/folder/unknown' })
    ).rejects.toThrow()
    await rm(path.join(folder, 'job.js'))
    await expect(
      executeLocalCompute(req, normalized, { _program: '/folder/job' })
    ).rejects.toThrow()
    delete process.env.LOCAL_VIYA_JS_JOBS
    await expect(
      executeLocalCompute(req, normalized, { _program: '/folder/job' })
    ).rejects.toThrow()
    const execute = viyaServices(req).viya!.execute!
    await expect(
      execute({
        program: normalized,
        variables: { _program: '/folder/job' }
      } as any)
    ).rejects.toThrow()
    await expect(readFile(marker)).rejects.toMatchObject({ code: 'ENOENT' })
    expect(spy).toHaveBeenCalledTimes(2)
  } finally {
    spy.mockRestore()
    process.sasjsRoot = saved.root
    process.driveLoc = saved.drive
    process.logsLoc = saved.logs
    process.secrets = saved.secrets
    process.runTimes = saved.runtimes
    process.nodeLoc = saved.node
    process.logger = saved.logger
    for (const [key, value] of Object.entries({
      MODE: saved.mode,
      LOCAL_VIYA_JS_JOBS: saved.jobs,
      LOCAL_VIYA_SCRIPT_MOCKS: saved.scripts
    })) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    await rm(root, { recursive: true, force: true })
  }
}, 30000)
