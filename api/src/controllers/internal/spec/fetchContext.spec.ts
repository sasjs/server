import { execFileSync } from 'child_process'
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { createJSProgram } from '../createJSProgram'

describe('JS request input context', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'sasjs-fetch-context-'))
  })

  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  it('preserves repeated request parameter fragments in the context', async () => {
    const output = path.join(dir, 'result.json')
    const generated = await createJSProgram(
      `fs.writeFileSync(${JSON.stringify(output)}, JSON.stringify(_sasjs_fetch_context.params))`,
      {} as any,
      { sasjs1data: ['first,', 'second'] } as any,
      { path: dir } as any,
      path.join(dir, 'webout'),
      path.join(dir, 'headers'),
      path.join(dir, 'token')
    )
    const script = path.join(dir, 'job.js')
    writeFileSync(script, generated)
    execFileSync(process.execPath, [script])
    expect(JSON.parse(readFileSync(output, 'utf8'))).toEqual({
      sasjs1data: ['first,', 'second']
    })
  })

  it('allows a stored program to declare fs while uploaded buffers are read', async () => {
    const output = path.join(dir, 'result.json')
    writeFileSync(path.join(dir, 'req_file_a'), 'file data')
    const generated = await createJSProgram(
      `const fs = require('fs'); fs.writeFileSync(${JSON.stringify(output)}, JSON.stringify({ text: _WEBIN_FILEREF1.toString(), tables: _sasjs_fetch_context.tables }))`,
      {} as any,
      {},
      { path: dir } as any,
      path.join(dir, 'webout'),
      path.join(dir, 'headers'),
      path.join(dir, 'token'),
      {
        filesNamesMap: {
          req_file_a: { fieldName: 'input', originalName: 'input.csv' }
        }
      }
    )
    const script = path.join(dir, 'job.js')
    writeFileSync(script, generated)
    execFileSync(process.execPath, [script])
    expect(JSON.parse(readFileSync(output, 'utf8'))).toEqual({
      text: 'file data',
      tables: [{ name: 'input', filename: 'input.csv', csv: 'file data' }]
    })
  })

  it('treats upload paths, names and filenames as data', async () => {
    const hostileDir = path.join(dir, "dir'quoted")
    require('fs').mkdirSync(hostileDir)
    const marker = path.join(dir, 'pwned')
    const hostile = `x'; require('fs').writeFileSync(${JSON.stringify(marker)}, 'pwned'); //`
    writeFileSync(path.join(hostileDir, 'req_file_a'), 'safe content')
    const output = path.join(dir, 'result.json')
    const generated = await createJSProgram(
      `fs.writeFileSync(${JSON.stringify(output)}, JSON.stringify(_sasjs_fetch_context))`,
      {} as any,
      {},
      { path: hostileDir } as any,
      path.join(dir, 'webout'),
      path.join(dir, 'headers'),
      path.join(dir, 'token'),
      {
        filesNamesMap: {
          req_file_a: { fieldName: hostile, originalName: hostile }
        }
      }
    )
    const script = path.join(dir, 'job.js')
    writeFileSync(script, generated)
    execFileSync(process.execPath, [script])
    expect(JSON.parse(readFileSync(output, 'utf8')).tables).toEqual([
      { name: hostile, filename: hostile, csv: 'safe content' }
    ])
    expect(require('fs').existsSync(marker)).toBe(false)
  })

  it('keeps reserved and prototype-named parameters as data without declaration collisions', async () => {
    const output = path.join(dir, 'result.json')
    const marker = path.join(dir, 'pwned')
    const payload = `"; require('fs').writeFileSync(${JSON.stringify(marker)}, 'pwned'); //`
    const params = JSON.parse(
      JSON.stringify({
        _sasjs_fetch_context: payload,
        _sasjs_webout: 'reserved',
        _sasjs_webout_config: 'reserved too',
        _WEBIN_FILE_COUNT: 'caller count',
        Object: 'caller Object',
        constructor: 'constructor value',
        ordinary: payload
      })
    )
    Object.defineProperty(params, '__proto__', {
      value: 'prototype value',
      enumerable: true
    })
    const generated = await createJSProgram(
      `fs.writeFileSync(${JSON.stringify(output)}, JSON.stringify({ params: _sasjs_fetch_context.params, hasOwn: Object.prototype.hasOwnProperty.call(_sasjs_fetch_context.params, '__proto__'), ordinary }))`,
      {} as any,
      params,
      { path: dir } as any,
      path.join(dir, 'webout'),
      path.join(dir, 'headers'),
      path.join(dir, 'token')
    )
    const script = path.join(dir, 'job.js')
    writeFileSync(script, generated)
    execFileSync(process.execPath, [script])
    const actual = JSON.parse(readFileSync(output, 'utf8'))
    expect(actual.params).toEqual(params)
    expect(actual.hasOwn).toBe(true)
    expect(actual.ordinary).toBe(payload)
    expect(require('fs').existsSync(marker)).toBe(false)
  })

  it('passes uploaded file contents through lexical bindings without embedding them', async () => {
    const output = path.join(dir, 'result.json')
    const csv1 = 'id:$char10.\nsecret-first\n'
    const csv2 = 'name:$char10.\nsecret-second\n'
    writeFileSync(path.join(dir, 'req_file_a'), csv1)
    writeFileSync(path.join(dir, 'req_file_b'), csv2)
    const generated = await createJSProgram(
      `fs.writeFileSync(${JSON.stringify(output)}, JSON.stringify({ context: _sasjs_fetch_context, count: _WEBIN_FILE_COUNT, firstIsBuffer: Buffer.isBuffer(_WEBIN_FILEREF1) }))`,
      {} as any,
      { param: 'value' },
      { path: dir } as any,
      path.join(dir, 'webout'),
      path.join(dir, 'headers'),
      path.join(dir, 'token'),
      {
        filesNamesMap: {
          req_file_a: { fieldName: 'first', originalName: 'first.csv' },
          req_file_b: { fieldName: 'raw', originalName: 'raw.txt' }
        }
      }
    )
    expect(generated).not.toContain('secret-first')
    expect(generated).not.toContain('secret-second')
    const script = path.join(dir, 'job.js')
    writeFileSync(script, generated)
    execFileSync(process.execPath, [script])
    const actual = JSON.parse(readFileSync(output, 'utf8'))
    expect(actual.count).toBe(2)
    expect(actual.firstIsBuffer).toBe(true)
    expect(actual.context).toEqual({
      params: { param: 'value' },
      tables: expect.arrayContaining([
        { name: 'first', filename: 'first.csv', csv: csv1 },
        { name: 'raw', filename: 'raw.txt', csv: csv2 }
      ])
    })
    expect(actual.context.tables).toHaveLength(2)
  })

  it('keeps legacy WEBIN indices in directory order while ordering FETCH by request', async () => {
    writeFileSync(path.join(dir, 'req_file_z'), 'first')
    writeFileSync(path.join(dir, 'req_file_a'), 'second')
    const directoryOrder = readdirSync(dir).filter((name) =>
      name.startsWith('req_file')
    )
    const values: Record<string, string> = {
      req_file_z: 'first',
      req_file_a: 'second'
    }
    const output = path.join(dir, 'result.json')
    const generated = await createJSProgram(
      `fs.writeFileSync(${JSON.stringify(output)}, JSON.stringify({ legacy: [_WEBIN_FILEREF1.toString(), _WEBIN_FILEREF2.toString()], tables: _sasjs_fetch_context.tables }))`,
      {} as any,
      {},
      { path: dir } as any,
      path.join(dir, 'webout'),
      path.join(dir, 'headers'),
      path.join(dir, 'token'),
      {
        filesNamesMap: {
          req_file_z: { fieldName: 'dup', originalName: 'first.csv' },
          req_file_a: { fieldName: 'dup', originalName: 'second.csv' }
        }
      }
    )
    const script = path.join(dir, 'job.js')
    writeFileSync(script, generated)
    execFileSync(process.execPath, [script])
    const result = JSON.parse(readFileSync(output, 'utf8'))
    expect(result.legacy).toEqual(
      directoryOrder.map((fileName) => values[fileName])
    )
    expect(result.tables.map((table: { csv: string }) => table.csv)).toEqual([
      'first',
      'second'
    ])
  })

  it('passes safe request parameters and no tables to the prelude when there are no files', async () => {
    const output = path.join(dir, 'result.json')
    const generated = await createJSProgram(
      `fs.writeFileSync(${JSON.stringify(output)}, JSON.stringify(_sasjs_fetch_context))`,
      {} as any,
      { _program: '/demo', amount: '42', 'bad-name': 'discard' },
      { path: dir } as any,
      path.join(dir, 'webout'),
      path.join(dir, 'headers'),
      path.join(dir, 'token')
    )
    const script = path.join(dir, 'job.js')
    writeFileSync(script, generated)
    execFileSync(process.execPath, [script])
    expect(JSON.parse(readFileSync(output, 'utf8'))).toEqual({
      params: { _program: '/demo', amount: '42' },
      tables: []
    })
  })
})
