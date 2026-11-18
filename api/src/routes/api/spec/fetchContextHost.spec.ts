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
      path.join(programFolder, 'lazy.js'),
      `const input = require('fs').createReadStream(_WEBIN_FILEREF1);
let bytes = 0;
input.on('data', chunk => { bytes += chunk.length });
input.on('end', () => { fs.writeFileSync(weboutPath, JSON.stringify({ bytes, name: _WEBIN_NAME1 })) });`
    )
    writeFileSync(
      path.join(programFolder, 'fetch.js'),
      `_webout = JSON.stringify(webout('FETCH'))`
    )
    writeFileSync(
      path.join(programFolder, 'mutate.js'),
      `const first = webout('FETCH');
fs.writeFileSync(_WEBIN_FILEREF1, 'id:best.\\n99');
const second = webout('FETCH');
fs.unlinkSync(_WEBIN_FILEREF1);
let error;
try { webout('FETCH'); } catch (err) { error = { code: err.code, syscall: err.syscall }; }
_webout = JSON.stringify({ first, second, error });`
    )
    writeFileSync(
      path.join(programFolder, 'empty.js'),
      `_webout = JSON.stringify(_sasjs_fetch_context)`
    )
    writeFileSync(
      path.join(programFolder, 'binary.js'),
      `
_webout = JSON.stringify({
  isPath: typeof _WEBIN_FILEREF1 === 'string',
  bytes: Array.from(fs.readFileSync(_WEBIN_FILEREF1)),
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
  firstIsPath: typeof _WEBIN_FILEREF1 === 'string' })
`
    )
    writeFileSync(
      path.join(programFolder, 'paths.js'),
      `
const entries = []
if (_WEBIN_FILE_COUNT >= 1) entries.push({ name: _WEBIN_NAME1, filename: _WEBIN_FILENAME1, path: _WEBIN_FILEREF1, bytes: Array.from(fs.readFileSync(_WEBIN_FILEREF1)) })
if (_WEBIN_FILE_COUNT >= 2) entries.push({ name: _WEBIN_NAME2, filename: _WEBIN_FILENAME2, path: _WEBIN_FILEREF2, bytes: Array.from(fs.readFileSync(_WEBIN_FILEREF2)) })
_webout = JSON.stringify({ count: _WEBIN_FILE_COUNT, entries, aliases: _WEBIN_FILE_COUNT ? { name: _WEBIN_NAME, filename: _WEBIN_FILENAME, path: _WEBIN_FILEREF } : [typeof _WEBIN_NAME, typeof _WEBIN_FILENAME, typeof _WEBIN_FILEREF], fetched: webout('FETCH') })
`
    )
  })

  afterAll(() => rmSync(programFolder, { recursive: true, force: true }))

  it('streams a multipart upload without calling FETCH', async () => {
    const bytes = Buffer.from([0, 0xff, 0x80, 0xc3, 0x28])
    const res = await request(app)
      .post('/SASjsApi/stp/execute?_program=/fetch-context-test/lazy')
      .attach('input', bytes, 'input.bin')
    expect(res.status).toBe(200)
    expect(JSON.parse(res.text)).toEqual({ bytes: bytes.length, name: 'input' })
  })

  it('exposes a staged path and first-file aliases for a binary upload', async () => {
    const bytes = Buffer.from([0, 0x80, 0xff, 0xc3, 0x28, 0x50, 0x4b])
    const res = await request(app)
      .post('/SASjsApi/stp/execute?_program=/fetch-context-test/paths')
      .attach('image', bytes, 'image.bin')
    expect(res.status).toBe(200)
    const result = JSON.parse(res.text)
    expect(result.count).toBe(1)
    expect(result.entries[0]).toMatchObject({
      name: 'image',
      filename: 'image.bin',
      bytes: Array.from(bytes)
    })
    expect(typeof result.entries[0].path).toBe('string')
    expect(path.isAbsolute(result.entries[0].path)).toBe(true)
    expect(result.aliases).toEqual({
      name: 'image',
      filename: 'image.bin',
      path: result.entries[0].path
    })
    expect(result.fetched).toEqual({})
  })

  it.each([
    ['UTF-8 BOM', Buffer.from([0xef, 0xbb, 0xbf, 0x61])],
    ['empty', Buffer.alloc(0)]
  ])('reads %s upload bytes without modification', async (_label, bytes) => {
    const res = await request(app)
      .post('/SASjsApi/stp/execute?_program=/fetch-context-test/paths')
      .attach('raw', bytes, 'raw.bin')
    expect(res.status).toBe(200)
    const result = JSON.parse(res.text)
    expect(result.entries[0].bytes).toEqual(Array.from(bytes))
    expect(result.entries[0].path).toEqual(expect.any(String))
  })

  it('keeps multi-file names and bytes associated while FETCH parses a mixed upload', async () => {
    const bytes = Buffer.from([0, 0xff, 0x80, 0xc3, 0x28])
    const res = await request(app)
      .post('/SASjsApi/stp/execute?_program=/fetch-context-test/paths')
      .attach('raw', bytes, 'raw.bin')
      .attach('table', Buffer.from('id:best.\n42'), 'table.csv')
    expect(res.status).toBe(200)
    const result = JSON.parse(res.text)
    expect(result.count).toBe(2)
    expect(result.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'raw',
          filename: 'raw.bin',
          bytes: Array.from(bytes),
          path: expect.any(String)
        }),
        expect.objectContaining({
          name: 'table',
          filename: 'table.csv',
          bytes: Array.from(Buffer.from('id:best.\n42')),
          path: expect.any(String)
        })
      ])
    )
    expect(result.aliases).toEqual({
      name: result.entries[0].name,
      filename: result.entries[0].filename,
      path: result.entries[0].path
    })
    expect(result.fetched).toEqual({ table: [{ id: 42 }] })
  })

  it('always supplies a zero count without files or first-file aliases', async () => {
    const res = await request(app).get('/SASjsApi/stp/execute').query({
      _program: '/fetch-context-test/paths',
      _WEBIN_FILE_COUNT: 'hostile'
    })
    expect(res.status).toBe(200)
    expect(JSON.parse(res.text)).toEqual({
      count: 0,
      entries: [],
      aliases: ['undefined', 'undefined', 'undefined'],
      fetched: {}
    })
  })

  it('treats hostile multipart names as data and protects WEBIN bindings from collisions', async () => {
    const name = "x';process.exit(19);//"
    const filename = "file';process.exit(20);.bin"
    const bytes = Buffer.from([0, 255])
    const res = await request(app)
      .post('/SASjsApi/stp/execute?_program=/fetch-context-test/paths')
      .field('_WEBIN_FILEREF', 'collision')
      .attach(name, bytes, filename)
    expect(res.status).toBe(200)
    const result = JSON.parse(res.text)
    expect(result.entries[0]).toMatchObject({
      name,
      filename,
      bytes: Array.from(bytes),
      path: expect.any(String)
    })
    expect(result.aliases.path).toBe(result.entries[0].path)
  })

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

  it('fetches a CRLF-terminated multi-column upload without a phantom row', async () => {
    const res = await request(app)
      .post('/SASjsApi/stp/execute?_program=/fetch-context-test/fetch')
      .attach(
        'input',
        Buffer.from('name:$char8. count:best.\r\nAda,2\r\n'),
        'input.csv'
      )
    expect(res.status).toBe(200)
    expect(JSON.parse(res.text)).toEqual({ input: [{ name: 'Ada', count: 2 }] })
  })

  it('discards blank records between distinct uploaded rows', async () => {
    const res = await request(app)
      .post('/SASjsApi/stp/execute?_program=/fetch-context-test/fetch')
      .attach('input', Buffer.from('x:$char8.\r\na\r\n\r\nb\r\n'), 'input.csv')
    expect(res.status).toBe(200)
    expect(JSON.parse(res.text)).toEqual({ input: [{ x: 'a' }, { x: 'b' }] })
  })

  it('discards adapter-format empty single-column records in multipart uploads', async () => {
    // Wire-format fixtures captured from @sasjs/adapter 6.1.1 convertToCSV.
    const empty = 'x:$char1.\r\n'
    const middle = 'x:$char1.\r\na\r\n\r\nb'
    const res = await request(app)
      .post('/SASjsApi/stp/execute?_program=/fetch-context-test/fetch')
      .attach('empty', Buffer.from(empty), 'empty.csv')
      .attach('middle', Buffer.from(middle), 'middle.csv')
    expect(res.status).toBe(200)
    expect(JSON.parse(res.text)).toEqual({
      empty: [],
      middle: [{ x: 'a' }, { x: 'b' }]
    })
  })

  it('FETCH re-reads a changed staged upload and throws if it is deleted', async () => {
    const res = await request(app)
      .post('/SASjsApi/stp/execute?_program=/fetch-context-test/mutate')
      .attach('table', Buffer.from('id:best.\n42'), 'table.csv')
    expect(res.status).toBe(200)
    expect(JSON.parse(res.text)).toEqual({
      first: { table: [{ id: 42 }] },
      second: { table: [{ id: 99 }] },
      error: { code: 'ENOENT', syscall: 'open' }
    })
  })

  it('preserves binary multipart bytes in WEBIN while FETCH receives UTF-8 text', async () => {
    const bytes = Buffer.from([0x00, 0x80, 0xff, 0xc3, 0x28, 0x0a, 0x50, 0x4b])
    const res = await request(app)
      .post('/SASjsApi/stp/execute?_program=/fetch-context-test/binary')
      .attach('image', bytes, 'image.bin')
    expect(res.status).toBe(200)
    const result = JSON.parse(res.text)
    expect(result.isPath).toBe(true)
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
    expect(result.firstIsPath).toBe(true)
    expect(result.context.tables).toEqual(
      expect.arrayContaining([
        { name: 'table1', filename: 'table1.csv', csv: 'id:$char8.\nA\n' },
        { name: 'raw', filename: 'raw.txt', csv: 'raw data' }
      ])
    )
    expect(result.context.tables).toHaveLength(2)
  })
})
