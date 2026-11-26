import { randomUUID } from 'crypto'

// _debug=131 iframe form captured in sasjs/adapter commit 74873e7a,
// src/job-execution/spec/WebJobExecutor.debug.spec.ts. This store exists only
// for the single-user local JS mock, not as a Viya file service.
const MAX_BYTES = 8 * 1024 * 1024
const MAX_ENTRIES = 128
const TTL_MS = 15 * 60 * 1000
const files = new Map<
  string,
  { body: string; expires: number; bytes: number }
>()
let used = 0

const remove = (id: string) => {
  const entry = files.get(id)
  if (entry) used -= entry.bytes
  files.delete(id)
}

const prune = () => {
  const now = Date.now()
  files.forEach((entry, id) => {
    if (entry.expires <= now) remove(id)
  })
}

export const saveDebugWebout = (body: string): string | undefined => {
  prune()
  const bytes = Buffer.byteLength(body)
  if (bytes > MAX_BYTES) return undefined
  while (files.size >= MAX_ENTRIES || used + bytes > MAX_BYTES) {
    const oldest = files.keys().next().value
    if (!oldest) break
    remove(oldest)
  }
  const id = randomUUID()
  files.set(id, { body, bytes, expires: Date.now() + TTL_MS })
  used += bytes
  return id
}

export const readDebugWebout = (id: string): string | undefined => {
  prune()
  return files.get(id)?.body
}

const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ]!
  )

export const debugPage = (id: string, log: string): string =>
  `<!DOCTYPE html><html><title>SASJobExecution</title><body><pre>${escapeHtml(log)}</pre><div style="text-align:left;color:black;font-family: arial,sans-serif;font-size:medium" ><iframe style="width: 99%; height: 500px; background-color:Canvas;" src=/SASJobExecution/?_fileid=${id}></iframe></div></body></html>`
