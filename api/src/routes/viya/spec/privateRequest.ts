import express from 'express'
import { createServer } from 'http'
import { Duplex } from 'stream'

/** Dispatch one HTTP request through an in-process socket. Never listens on any address. */
export const privateRequest = async (
  app: express.Express,
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any }> => {
  const server = createServer(app)
  const chunks: Buffer[] = []
  const socket = new Duplex({
    allowHalfOpen: true,
    read() {},
    write(chunk, _encoding, callback) {
      chunks.push(Buffer.from(chunk))
      callback()
    }
  })
  const result = new Promise<{ status: number; body: any }>(
    (resolve, reject) => {
      socket.on('error', reject)
      socket.on('finish', () => {
        try {
          const raw = Buffer.concat(chunks).toString('utf8')
          const [head, ...rest] = raw.split('\r\n\r\n')
          const status = Number(/^HTTP\/1\.1 (\d+)/.exec(head)?.[1])
          const text = rest.join('\r\n\r\n')
          let parsed: any = text
          try {
            parsed = text ? JSON.parse(text) : undefined
          } catch {
            // Server permission refusals may be plain text.
          }
          resolve({ status, body: parsed })
        } catch (error) {
          reject(error)
        } finally {
          socket.destroy()
        }
      })
    }
  )
  server.emit('connection', socket)
  const payload = body === undefined ? '' : JSON.stringify(body)
  const fields = {
    Host: 'private.invalid',
    Connection: 'close',
    ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    'Content-Length': String(Buffer.byteLength(payload)),
    ...headers
  }
  socket.push(
    `${method} ${path} HTTP/1.1\r\n${Object.entries(fields)
      .map(([name, value]) => `${name}: ${value}\r\n`)
      .join('')}\r\n${payload}`
  )
  return result
}
