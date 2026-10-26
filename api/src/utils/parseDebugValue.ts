/**
 * The value the core macros use for "return the session log". `ms_runstp`
 * defaults `debug=131` and the generated services test `%if &_debug ge 131`.
 */
export const DEBUG_ON = 131

/**
 * Normalises the `_debug` query parameter.
 *
 * `_debug` is supplied by the caller, and the macros in @sasjs/core do not only
 * send numbers: `%mx_execute` defaults to `_debug=log`, and `%ms_runstp` passes
 * whatever it was given into the URL. The parameter's only job is "is the
 * session log wanted", so a name means the same thing as the canonical 131 -
 * there is no per-level behaviour behind it to preserve.
 *
 * Returns undefined for an absent parameter, so "not asked for" stays distinct
 * from "asked for".
 */
export const parseDebugValue = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined

  if (typeof value === 'number') return value

  const parsed = Number(String(value).trim())

  return Number.isFinite(parsed) ? parsed : DEBUG_ON
}
