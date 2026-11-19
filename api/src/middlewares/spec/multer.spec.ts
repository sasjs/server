/**
 * The statuses the upload parser answers, and where each refusal comes from.
 *
 * Two arms protect the same ceiling: the filter compares the request's
 * `Content-Length` and refuses with its own message, while multer's
 * `limits.fileSize` catches a part that streams past it with no header to
 * compare. Both answer 400, as does every other MulterError - the file sent under
 * the wrong field name included - because each describes the caller's request and
 * multer carries no status of its own. The second arm used to answer 500, and the
 * emulated mount renders these statuses in the estate's envelope, so a wrong
 * number there travels further than a log line.
 */
import express from 'express'
import { mkdtemp, rm, writeFile } from 'fs/promises'
import http from 'http'
import { tmpdir } from 'os'
import { join } from 'path'
import request from 'supertest'

import type { RefusalWriter } from '../multer'

describe('the upload parser', () => {
  let root = ''

  beforeAll(async () => {
    // the parser reads the server's folder layout when it is imported, so the
    // root is set before the first `import()`
    root = await mkdtemp(join(tmpdir(), 'multer-status-'))
    process.sasjsRoot = root
    process.driveLoc = join(root, 'drive')
  })

  afterAll(async () => {
    await rm(root, { recursive: true, force: true })
  })

  const mount = async (limit: number, answered: number[]) => {
    const { multerSingle } = await import('../multer')

    const writeRefusal: RefusalWriter = (res, { status, message }) => {
      answered.push(status)

      res.status(status).json({ status, message })
    }

    const server = express()

    server.post('/', (req, res) =>
      multerSingle('file', [req, res, () => res.status(201).end()], {
        fileSize: limit,
        writeRefusal
      })
    )

    return server
  }

  const multipart = (bytes: number) => {
    const boundary = 'part-boundary'

    return {
      boundary,
      body: Buffer.concat([
        Buffer.from(
          `--${boundary}\r\n` +
            'Content-Disposition: form-data; name="file"; filename="a.txt"\r\n' +
            'Content-Type: text/plain\r\n\r\n'
        ),
        Buffer.alloc(bytes, 'x'),
        Buffer.from(`\r\n--${boundary}--\r\n`)
      ])
    }
  }

  it('refuses an over-cap part by its Content-Length, as the filter does', async () => {
    const answered: number[] = []
    const app = await mount(8, answered)

    const answer = await request(app)
      .post('/')
      .attach('file', Buffer.alloc(9, 'x'), 'a.txt')

    expect(answer.status).toBe(400)
    expect(answer.body.message).toMatch(/^File size is over limit/)
    expect(answered).toEqual([400])
  })

  /**
   * The case the 500 hid: a part sent as a stream carries no `Content-Length` for
   * the filter to compare, so multer's own limit is what refuses it. It is the
   * same refusal and answers the same status; a 500 here says the server failed.
   */
  it('answers an over-cap part that arrives without Content-Length the same way', async () => {
    const answered: number[] = []
    const app = await mount(8, answered)

    // a real listener, because the body has to be written in chunks: supertest
    // buffers what it is given and computes a Content-Length, which is the
    // header this case exists to do without
    const server = await new Promise<import('http').Server>((resolve) => {
      const listener = app.listen(0, () => resolve(listener))
    })
    const { port } = server.address() as { port: number }

    try {
      const { boundary, body } = multipart(9)

      const answer = await new Promise<{
        status: number
        body: { message: string }
      }>((resolve, reject) => {
        const req = http.request(
          {
            port,
            path: '/',
            method: 'POST',
            headers: {
              'Content-Type': `multipart/form-data; boundary=${boundary}`,
              'Transfer-Encoding': 'chunked'
            }
          },
          (res) => {
            const chunks: Buffer[] = []

            res.on('data', (chunk) => chunks.push(chunk as Buffer))
            res.on('end', () =>
              resolve({
                status: res.statusCode as number,
                body: JSON.parse(Buffer.concat(chunks).toString())
              })
            )
          }
        )

        req.on('error', reject)
        req.write(body.subarray(0, 40))
        req.write(body.subarray(40))
        req.end()
      })

      expect(answer.status).toBe(400)
      expect(answer.body.message).toBe('File too large')
      expect(answered).toEqual([400])
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  })

  /**
   * The other caller-side code the 500 hid: a file sent under a field name the
   * route does not read. It named the server as failed for a request the caller
   * can fix.
   */
  it('answers a file under the wrong field name as a caller error', async () => {
    const answered: number[] = []
    const app = await mount(1024, answered)

    const answer = await request(app)
      .post('/')
      .attach('other', Buffer.from('x'), 'a.txt')

    expect(answer.status).toBe(400)
    expect(answer.body.message).toBe('Unexpected file field')
    expect(answered).toEqual([400])
  })

  /**
   * A failure that belongs to the server: the destination cannot be written. Its
   * message can carry an absolute path, so the caller gets a fixed sentence and
   * the error goes to the log instead.
   */
  it('answers a storage failure as a server error, without the path', async () => {
    const answered: number[] = []
    const app = await mount(1024, answered)

    // a regular file where the uploads folder belongs, so it cannot be created
    // (an earlier case in this file left the folder there)
    await rm(join(root, 'uploads'), { recursive: true, force: true })
    await writeFile(join(root, 'uploads'), 'x')

    try {
      const answer = await request(app)
        .post('/')
        .attach('file', Buffer.from('x'), 'a.txt')

      expect(answer.status).toBe(500)
      expect(answer.body.message).toBe('The file could not be stored.')
      expect(answered).toEqual([500])
    } finally {
      await rm(join(root, 'uploads'), { force: true })
    }
  })
})
