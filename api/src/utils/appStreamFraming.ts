import { Response } from 'express'

/**
 * The framing policy an app asks for, as CSP `frame-ancestors` sources.
 *
 * Accepts one source or a list, because the common case is one origin and the
 * useful case is a list. An entry that names nothing falls back to the server's
 * own policy, which is `'self'`: the default has to keep today's behaviour
 * exactly, since every app that never asked for framing is framed by nobody.
 */
export const frameAncestorsSources = (
  frameAncestors?: string | string[]
): string[] => {
  const sources = Array.isArray(frameAncestors)
    ? frameAncestors
    : frameAncestors
      ? [frameAncestors]
      : []

  return sources
    .map((source) => String(source ?? '').trim())
    .filter((source) => source.length > 0)
}

/**
 * Applies one app's framing policy to a response helmet has already written.
 *
 * The server-wide policy is set by helmet for every response; this narrows or
 * widens it for a single app, which is the whole point of a per-app setting -
 * the alternative was relaxing `frame-ancestors` for the entire server and
 * weakening every other app on it.
 *
 * `X-Frame-Options` cannot express a list of origins, and when CSP
 * `frame-ancestors` is present a browser prefers it, so on an explicit policy
 * the legacy header is removed rather than left to contradict the policy. An app
 * with no setting keeps helmet's headers untouched.
 */
export const applyAppFraming = (
  res: Response,
  frameAncestors?: string | string[]
): void => {
  const sources = frameAncestorsSources(frameAncestors)

  if (!sources.length) return

  const policy = res.getHeader('content-security-policy')

  // A deployment can turn the policy off entirely (HELMET_CSP_CONFIG_PATH); with
  // no policy to narrow, HEADER `X-Frame-Options` is all there is, and removing
  // it would allow framing by anyone rather than by the origins named.
  if (typeof policy !== 'string') return

  const directives = policy
    .split(';')
    .map((directive) => directive.trim())
    .filter(
      (directive) => directive && !directive.startsWith('frame-ancestors')
    )

  directives.push(`frame-ancestors ${sources.join(' ')}`)

  res.setHeader('content-security-policy', directives.join('; '))
  res.removeHeader('x-frame-options')
}
