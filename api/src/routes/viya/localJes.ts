import express from 'express'
import { randomUUID } from 'crypto'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import { dispatchViya } from '@sasjs/api'
import type { Services } from '@sasjs/api'
import {
  ExecutionController,
  getSessionController
} from '../../controllers/internal'
import { resolveDrivePath } from '../../controllers/internal/nodeDriveStore'
import { getPreProgramVariables, ModeType, RunTimeType } from '../../utils'
import { SessionState } from '../../types'
import { isValidSasName } from '../../utils/programVariables'

// An explicit operator-controlled mapping, only for a trusted desktop mock.
export const localJesEnabled = () =>
  process.env.MODE === ModeType.Desktop && !!process.env.LOCAL_VIYA_JS_JOBS

export const registry = (): Record<string, string> => {
  try {
    const value = JSON.parse(process.env.LOCAL_VIYA_JS_JOBS || '{}')
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
    return Object.fromEntries(
      Object.entries(value).filter(
        ([job, file]) =>
          /^\/(?:[\w.-]+\/)*[\w.-]+$/.test(job) &&
          !job.split('/').some((s) => s === '.' || s === '..') &&
          typeof file === 'string' &&
          /^\/(?:[\w.-]+\/)*[\w.-]+\.js$/.test(file) &&
          !file.split('/').some((s) => s === '.' || s === '..')
      )
    ) as Record<string, string>
  } catch {
    return {}
  }
}

// A token, not SAS: submitted bytes must match this exact registered selector.
export const localComputeCode = (name: string) =>
  `/* SASjs local JS mock: ${name} */`

const idFor = (name: string) => Buffer.from(name).toString('base64url')
const definitionPath = (name: string) =>
  `/jobDefinitions/definitions/${idFor(name)}`
const findDefinition = (id: string) =>
  Object.keys(registry()).find((name) => idFor(name) === id)

// The adapter posts raw CSV with application/json, not multipart. Its #rawUpload
// fragment is not transmitted; such a body is not a valid existing file upload.
const uploads = new Map<string, { contents: Buffer; expires: number }>()
const jobs = new Map<
  string,
  { result: string; log: string; state: string; expires: number }
>()
const TTL = 15 * 60 * 1000
const MAX_BYTES = 16 * 1024 * 1024
export const claimSession = (username: string) =>
  getSessionController(RunTimeType.JS).getSession(username)
const prune = () => {
  const now = Date.now()
  uploads.forEach((entry, id) => {
    if (entry.expires < now) uploads.delete(id)
  })
  jobs.forEach((entry, id) => {
    if (entry.expires < now) jobs.delete(id)
  })
}

export const takeUploads = (args: Record<string, any>) => {
  prune()
  const rawCount = args._webin_file_count ?? 0
  const count = Number(rawCount)
  if (!Number.isInteger(count) || count < 0 || count > 16)
    throw new Error('Invalid upload count')
  const parts: { id: string; field: string; content: Buffer }[] = []
  for (let i = 1; i <= count; i++) {
    const uri =
      typeof args[`_webin_fileuri${i}`] === 'string' &&
      /^\/files\/files\/([0-9a-f-]+)$/.exec(args[`_webin_fileuri${i}`])
    const field = args[`_webin_name${i}`]
    const upload = uri && uploads.get(uri[1])
    if (
      !upload ||
      typeof field !== 'string' ||
      !/^[A-Za-z_][A-Za-z0-9_]{0,31}$/.test(field) ||
      parts.some((part) => part.id === uri![1])
    )
      throw new Error('Invalid or missing upload')
    parts.push({ id: uri![1], field, content: upload.contents })
  }
  parts.forEach((part) => uploads.delete(part.id))
  return parts
}

export const addJesMembers = async (
  req: express.Request,
  services: Services,
  answer: any
) => {
  if (
    !localJesEnabled() ||
    req.method !== 'GET' ||
    !/^\/folders\/folders\/[^/]+\/members$/.test(req.path) ||
    answer.status !== 200
  )
    return
  const id = req.path.split('/')[3]
  const folders = Array.from(
    new Set(Object.keys(registry()).map((job) => path.posix.dirname(job)))
  )
  for (const folder of folders) {
    const found = await dispatchViya(
      services,
      'GET',
      '/folders/folders/@item',
      { query: { path: folder } }
    )
    if (found.status !== 200 || (found.body as any)?.id !== id) continue
    for (const name of Object.keys(registry()).filter(
      (job) => path.posix.dirname(job) === folder
    )) {
      const href = definitionPath(name)
      answer.body.items.push({
        name: path.posix.basename(name),
        type: 'jobDefinition',
        code: localComputeCode(name),
        uri: href,
        links: [{ rel: 'getResource', href }]
      })
    }
    answer.body.count = answer.body.items.length
  }
}

export const localJesRouter = express.Router()
localJesRouter.use(async (req, res, next) => {
  if (!localJesEnabled()) return next()
  prune()
  const definition = /^\/jobDefinitions\/definitions\/([^/]+)$/.exec(req.path)
  if (req.method === 'GET' && definition) {
    const name = findDefinition(definition[1])
    if (!name) return res.sendStatus(404)
    return res.json({
      id: definition[1],
      name: path.posix.basename(name),
      uri: definitionPath(name)
    })
  }
  if (
    req.method === 'POST' &&
    req.path === '/files/files' &&
    /^application\/json\b/i.test(req.get('content-type') ?? '')
  ) {
    const raw = express.raw({ type: () => true, limit: '8mb' })
    return raw(req, res, (error) => {
      if (error || !Buffer.isBuffer(req.body))
        return res.status(400).send('Invalid local mock upload.')
      const held = Array.from(uploads.values()).reduce(
        (sum, entry) => sum + entry.contents.length,
        0
      )
      if (uploads.size >= 128 || held + req.body.length > MAX_BYTES)
        return res.status(503).send('Local mock upload limit reached.')
      const id = randomUUID()
      uploads.set(id, { contents: req.body, expires: Date.now() + TTL })
      return res.status(201).json({ id })
    })
  }
  if (req.method === 'POST' && req.path === '/jobExecution/jobs') {
    const body = req.body as any
    const args = body?.arguments
    const name =
      typeof args?._program === 'string'
        ? args._program.replace(/\/{2,}/g, '/')
        : undefined
    const target = typeof name === 'string' ? registry()[name] : undefined
    if (!target || body?.jobDefinition?.id !== idFor(name))
      return res.status(400).send('Unregistered local JS job.')
    if (!args || typeof args !== 'object' || Array.isArray(args))
      return res.status(400).send('Invalid local mock arguments.')
    const count = Number(args._webin_file_count ?? 0)
    if (!Number.isInteger(count) || count < 0 || count > 16 || jobs.size >= 128)
      return res.status(400).send('Invalid local mock job.')
    // JES arguments are strings. Protocol fields are handled separately so the
    // caller cannot override the selector, debug or generated upload bindings.
    const protocol = new Set([
      '_program',
      '_DEBUG',
      '_contextName',
      '_webin_file_count',
      '_OMITJSONLISTING',
      '_OMITJSONLOG',
      '_omitSessionResults',
      '_OMITTEXTLISTING',
      '_OMITTEXTLOG'
    ])
    for (let i = 1; i <= count; i++) {
      protocol.add(`_webin_fileuri${i}`)
      protocol.add(`_webin_name${i}`)
    }
    const reserved = new Set(Array.from(protocol, (key) => key.toLowerCase()))
    const vars: Record<string, string | number> = Object.create(null)
    for (const [key, value] of Object.entries(args)) {
      if (typeof value !== 'string' || !isValidSasName(key))
        return res.status(400).send('Unsupported local mock argument.')
      if (protocol.has(key)) continue
      if (reserved.has(key.toLowerCase()) || /^_webin_/i.test(key))
        return res.status(400).send('Unsupported local mock argument.')
      vars[key] = value
    }
    if (args._DEBUG !== undefined && !/^\d+$/.test(args._DEBUG))
      return res.status(400).send('Invalid local mock debug level.')
    vars._program = name
    vars._debug = Number(args._DEBUG ?? 0)
    if (!process.runTimes.includes(RunTimeType.JS))
      return res.status(400).send('JS runtime is disabled.')
    const parts: { id: string; field: string; content: Buffer }[] = []
    for (let i = 1; i <= count; i++) {
      const uri = /^\/files\/files\/([0-9a-f-]+)$/.exec(
        args[`_webin_fileuri${i}`] || ''
      )
      const field = args[`_webin_name${i}`]
      const upload = uri && uploads.get(uri[1])
      if (
        !upload ||
        typeof field !== 'string' ||
        !/^[A-Za-z_][A-Za-z0-9_]{0,31}$/.test(field)
      )
        return res.status(400).send('Invalid local mock input.')
      parts.push({ id: uri![1], field, content: upload.contents })
    }
    const id = randomUUID()
    const base = `/jobExecution/jobs/${id}`
    let session
    const staged: string[] = []
    parts.forEach((part) => uploads.delete(part.id))
    try {
      const file = resolveDrivePath(target)
      const pre = getPreProgramVariables(req)
      session = await claimSession(pre.username)
      const filesNamesMap: Record<
        string,
        { fieldName: string; originalName: string }
      > = {}
      for (const part of parts) {
        const fileName = `req_file_${randomUUID().replace(/-/g, '')}`
        await writeFile(path.join(session.path, fileName), part.content)
        staged.push(path.join(session.path, fileName))
        filesNamesMap[fileName] = {
          fieldName: part.field,
          originalName: `${part.field}.csv`
        }
      }
      const output = await new ExecutionController().executeFile({
        programPath: file,
        runTime: RunTimeType.JS,
        preProgramVariables: pre,
        vars,
        otherArgs: { filesNamesMap },
        session,
        separateWebout: true
      })
      const result = output.result.toString()
      const held = Array.from(jobs.values()).reduce(
        (sum, job) =>
          sum + Buffer.byteLength(job.result) + Buffer.byteLength(job.log),
        0
      )
      if (
        held + Buffer.byteLength(result) + Buffer.byteLength(output.log) >
        MAX_BYTES
      )
        throw new Error('Local mock output limit reached.')
      jobs.set(id, {
        result,
        log: output.log,
        state: output.failureReason ? 'failed' : 'completed',
        expires: Date.now() + TTL
      })
    } catch (error) {
      if (session) session.state = SessionState.failed
      jobs.set(id, {
        result: '',
        log: 'Local JS execution failed.',
        state: 'failed',
        expires: Date.now() + TTL
      })
    } finally {
      await Promise.all(
        staged.map((file) => unlink(file).catch(() => undefined))
      )
    }
    return res
      .status(201)
      .json({ id, links: [{ rel: 'state', href: `${base}/state` }] })
  }
  const match =
    /^\/jobExecution\/jobs\/([^/]+)(?:\/(state|result\/content|log\/content))?$/.exec(
      req.path
    )
  if (req.method === 'GET' && match) {
    const job = jobs.get(match[1])
    if (!job) return res.sendStatus(404)
    const base = `/jobExecution/jobs/${match[1]}`
    if (match[2] === 'state') return res.type('text/plain').send(job.state)
    if (match[2] === 'result/content')
      return res.type('text/plain').send(job.result)
    if (match[2] === 'log/content')
      return res.json({ items: job.log.split('\n').map((line) => ({ line })) })
    return res.json({
      id: match[1],
      results:
        job.state === 'completed' ? { '_webout.json': `${base}/result` } : {},
      links: [{ rel: 'log', href: `${base}/log` }],
      ...(job.state === 'failed'
        ? { error: { message: 'Local JS execution failed.' } }
        : {})
    })
  }
  return next()
})
