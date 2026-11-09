#!/usr/bin/env node
/**
 * Serves the built mock site the way a static host does.
 *
 * Two things a plain file server gets wrong for this site: an unknown path is a
 * 404 rather than the app's own index.html (so a reload on /SASjsStudio would
 * fail), and a file with no extension is served as octet-stream. Both are fixed
 * here so a local run matches GitHub Pages closely enough to trust.
 *
 * Usage: node mock/serve.mjs [port]
 */
import { createReadStream, existsSync, statSync } from 'fs'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const site = path.join(root, 'sasjsbuild', 'mock')
const port = Number(process.argv[2] ?? 8765)

if (!existsSync(path.join(site, 'index.html')))
  throw new Error(`No mock site at ${site}. Run: npm run mock:build`)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.map': 'application/json'
}

const send = (response, file, status = 200) => {
  response.writeHead(status, {
    'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
    // the worker must be allowed to answer for the whole origin
    'service-worker-allowed': '/',
    'cache-control': 'no-cache'
  })

  createReadStream(file).pipe(response)
}

http
  .createServer((request, response) => {
    const requested = decodeURIComponent(
      new URL(request.url, `http://localhost:${port}`).pathname
    )

    const candidate = path.join(site, requested)

    // no climbing out of the site
    if (!candidate.startsWith(site)) return send(response, path.join(site, 'index.html'), 400)

    if (existsSync(candidate) && statSync(candidate).isFile())
      return send(response, candidate)

    const index = path.join(candidate, 'index.html')
    if (existsSync(index) && statSync(index).isFile()) return send(response, index)

    // what GitHub Pages does: unknown paths get 404.html, which `mock:build`
    // writes as a copy of the app. A site built without that copy still answers
    // the app rather than an empty reply.
    const fallback = path.join(site, '404.html')

    return send(
      response,
      existsSync(fallback) ? fallback : path.join(site, 'index.html'),
      404
    )
  })
  .listen(port, () => {
    process.stdout.write(`Mock site on http://localhost:${port}\n`)
  })
