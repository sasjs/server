import { Request } from 'express'

// A private request marker, set only when the web tier forwards to the API.
export const tierProgramRequest = Symbol('tierProgramRequest')
export const viyaWebJobRequest = Symbol('viyaWebJobRequest')

/** Merge body fields into query variables without creating case-only aliases. */
export const mergeTierPostVariables = (
  query: Request['query'],
  body: Record<string, unknown> | undefined,
  program: unknown
): Record<string, unknown> => {
  const vars: Record<string, unknown> = { ...query }
  const queryNames = new Map(
    Object.keys(query).map((key) => [key.toLowerCase(), key])
  )
  for (const [key, value] of Object.entries(body ?? {})) {
    // A selected program is authoritative even if it came from the body.
    if (program !== undefined && key.toLowerCase() === '_program') continue
    const matchingQueryName = queryNames.get(key.toLowerCase())
    Object.defineProperty(vars, matchingQueryName ?? key, {
      value,
      writable: true,
      enumerable: true,
      configurable: true
    })
  }
  // Keep the program variable aligned with the path selected before upload.
  if (program !== undefined) vars._program = program
  return vars
}
