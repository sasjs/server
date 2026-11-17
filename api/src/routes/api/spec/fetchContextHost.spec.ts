import './fetchContextDesktopEnv'
import { mkdirSync, rmSync, writeFileSync } from 'fs'
import path from 'path'
import request from 'supertest'
import appPromise from '../../../app'
import { RunTimeType } from '../../../utils'

describe('JS request context through the STP host', () => {
  const root = path.join(process.cwd(), 'sasjs_root')
  const programFolder = path.join(root, 'drive', 'files', 'fetch-context-test')
  let app: Awaited<typeof appPromise>

  beforeAll(async () => {
    app = await appPromise
    process.runTimes = [RunTimeType.JS]
    process.nodeLoc = process.execPath
    mkdirSync(programFolder, { recursive: true })
    writeFileSync(
      path.join(programFolder, 'fetch.js'),
      `_webout = JSON.stringify(webout('FETCH'))`
    )
    writeFileSync(
      path.join(programFolder, 'empty.js'),
      `_webout = JSON.stringify(_sasjs_fetch_context)`
    )
    writeFileSync(
      path.join(programFolder, 'binary.js'),
      `
_webout = JSON.stringify({
  isBuffer: Buffer.isBuffer(_WEBIN_FILEREF1),
  bytes: Array.from(_WEBIN_FILEREF1),
  filename: _WEBIN_FILENAME1,
  name: _WEBIN_NAME1,
  csv: _sasjs_fetch_context.tables[0].csv,
  fetched: webout('FETCH')
})
`
    )
    writeFileSync(
      path.join(programFolder, 'capture.js'),
      `
_webout = JSON.stringify({ context: _sasjs_fetch_context, fileCount: _WEBIN_FILE_COUNT,
  firstIsBuffer: Buffer.isBuffer(_WEBIN_FILEREF1) })
`
    )
  })

  afterAll(() => rmSync(programFolder, { recursive: true, force: true }))

  it('runs shared FETCH over real multipart uploads and inline parameter tables', async () => {
    const res = await request(app)
      .post('/SASjsApi/stp/execute?_program=/fetch-context-test/fetch')
      .field('sasjs_tables', 'inline')
      .field('sasjs1data', 'name:$char8.\ninline')
      .attach('table1', Buffer.from('id:best.\n42'), 'table1.csv')
      .attach('table2', Buffer.from('word:$char8.\nvalue'), 'table2.csv')
      .attach('raw', Buffer.from('raw data'), 'raw.txt')
    expect(res.status).toBe(200)
    expect(JSON.parse(res.text)).toEqual({
      inline: [{ name: 'inline' }],
      table1: [{ id: 42 }],
      table2: [{ word: 'value' }]
    })
  })

  it('preserves binary multipart bytes in WEBIN while FETCH receives UTF-8 text', async () => {
    const bytes = Buffer.from([0x00, 0x80, 0xff, 0xc3, 0x28, 0x0a, 0x50, 0x4b])
    const res = await request(app)
      .post('/SASjsApi/stp/execute?_program=/fetch-context-test/binary')
      .attach('image', bytes, 'image.bin')
    expect(res.status).toBe(200)
    const result = JSON.parse(res.text)
    expect(result.isBuffer).toBe(true)
    expect(result.bytes).toEqual(Array.from(bytes))
    expect(result.filename).toBe('image.bin')
    expect(result.name).toBe('image')
    expect(result.csv).toBe(bytes.toString('utf8'))
    expect(Buffer.from(result.csv, 'utf8')).not.toEqual(bytes)
    expect(result.fetched).toEqual({})
  })

  it('FETCH chooses the last multipart upload with a repeated field name', async () => {
    let upload = request(app).post(
      '/SASjsApi/stp/execute?_program=/fetch-context-test/fetch'
    )
    for (const value of [
      'first',
      'second',
      'third',
      'fourth',
      'fifth',
      'sixth'
    ]) {
      upload = upload.attach(
        'duplicate',
        Buffer.from(`value:$char8.\n${value}`),
        `${value}.csv`
      )
    }
    const res = await upload
    expect(res.status).toBe(200)
    expect(JSON.parse(res.text)).toEqual({ duplicate: [{ value: 'sixth' }] })
  })

  it('passes a real GET without files and handles reserved parameter names', async () => {
    const res = await request(app).get('/SASjsApi/stp/execute').query({
      _program: '/fetch-context-test/empty',
      _sasjs_fetch_context: 'input',
      _sasjs_webout: 'other',
      query: 'hello'
    })
    expect(res.status).toBe(200)
    const result = JSON.parse(res.text)
    expect(result.params).toMatchObject({
      _sasjs_fetch_context: 'input',
      _sasjs_webout: 'other',
      query: 'hello'
    })
    expect(result.tables).toEqual([])
  })

  it('preserves multipart order for repeated upload fields in the FETCH context', async () => {
    const values = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth']
    let upload = request(app).post(
      '/SASjsApi/stp/execute?_program=/fetch-context-test/capture'
    )
    for (const value of values) {
      upload = upload.attach(
        'duplicate',
        Buffer.from(`value:$char8.\n${value}`),
        `${value}.csv`
      )
    }
    const res = await upload
    expect(res.status).toBe(200)
    const result = JSON.parse(res.text)
    expect(result.context.tables).toEqual(
      values.map((value) => ({
        name: 'duplicate',
        filename: `${value}.csv`,
        csv: `value:$char8.\n${value}`
      }))
    )
  })

  it('passes multipart parameters and multiple uploaded files to the generated program', async () => {
    const res = await request(app)
      .post(
        '/SASjsApi/stp/execute?_program=/fetch-context-test/capture&query=hello'
      )
      .field('bodyparam', 'world')
      .attach('table1', Buffer.from('id:$char8.\nA\n'), 'table1.csv')
      .attach('raw', Buffer.from('raw data'), 'raw.txt')
    expect(res.status).toBe(200)
    const result = JSON.parse(res.text)
    expect(result.context.params).toMatchObject({
      query: 'hello',
      bodyparam: 'world'
    })
    expect(result.fileCount).toBe(2)
    expect(result.firstIsBuffer).toBe(true)
    expect(result.context.tables).toEqual(
      expect.arrayContaining([
        { name: 'table1', filename: 'table1.csv', csv: 'id:$char8.\nA\n' },
        { name: 'raw', filename: 'raw.txt', csv: 'raw data' }
      ])
    )
    expect(result.context.tables).toHaveLength(2)
  })
})
