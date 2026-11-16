/**
 * What to tell an admin when a publish is refused.
 *
 * The deploy routes refuse with `{ status: 'failure', message }`, and a proxy in
 * front of the server refuses with a page or with nothing at all. The panel read
 * the body only when it was a string, which is the one shape those routes never
 * send - so every refusal, however specific the server was, read "The build could
 * not be published." and the reason was thrown away.
 *
 * The sender's own sentence is kept as it is written: it names the file, what the
 * file holds and what was expected of it, and rewording it here would be a second
 * account of the same refusal.
 */

/** A reason is quoted as it arrived, up to the length a banner can hold. */
const LIMIT = 500

const truncate = (text: string): string => {
  const trimmed = text.trim()

  return trimmed.length <= LIMIT ? trimmed : `${trimmed.slice(0, LIMIT)}...`
}

/** The title of an HTML page, which is what a proxy's refusal leads with. */
const titleOf = (html: string): string => {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)

  return match ? match[1].replace(/\s+/g, ' ').trim() : ''
}

/** The keys a refusal states its reason under, in the order worth reading them. */
const REASON_KEYS = ['message', 'error', 'detail']

/**
 * The reason a response gives, whichever shape it arrives in: a JSON envelope's
 * `message`, a plain string, a validation error's `error`, an HTML page's title.
 *
 * A body that carries no reason at all answers `''` rather than being printed -
 * `{}` and `[]` are what an empty answer looks like, and neither tells a reader
 * anything about the refusal.
 */
const reasonOf = (body: unknown): string => {
  if (typeof body === 'string') {
    const text = body.trim()

    if (!text) return ''

    return text.startsWith('<') ? truncate(titleOf(text)) : truncate(text)
  }

  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>

    for (const key of REASON_KEYS) {
      const value = record[key]

      if (typeof value === 'string' && value.trim()) return truncate(value)
    }

    return Object.keys(record).length ? truncate(JSON.stringify(record)) : ''
  }

  return ''
}

/**
 * The banner for a refused publish: the status the server answered, and the
 * reason it gave.
 *
 * A request that never reached the server has no status, and its reason is the
 * browser's own (`Network Error`, a CORS refusal, a dropped connection) - which
 * is still more than the panel said before.
 */
export const refusalText = (error: unknown): string => {
  const response = (error as any)?.response
  const status =
    typeof response?.status === 'number' ? response.status : undefined
  const answered = status === undefined ? '' : ` (HTTP ${status})`

  const reason = reasonOf(response?.data) || reasonOf((error as any)?.message)

  if (reason) return `The build could not be published${answered}: ${reason}`

  if (status === undefined)
    return 'The build could not be published: the request did not reach the server, and the browser said nothing else.'

  const statusText =
    typeof response?.statusText === 'string' && response.statusText.trim()
      ? ` (${response.statusText.trim()})`
      : ''

  return `The build could not be published: the server answered HTTP ${status}${statusText} and gave no reason.`
}
