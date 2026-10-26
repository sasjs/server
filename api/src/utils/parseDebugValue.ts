/**
 * The value the core macros use for "return the session log". `ms_runstp`
 * defaults `debug=131` and the generated services test `%if &_debug ge 131`.
 *
 * 131 follows the SAS Application Broker's `_DEBUG` convention, where the value
 * is a set of bit flags: 128 returns the log, 2 prints timing, 1 echoes the
 * fields - so 131 is LOG + TIME + FIELDS. The same convention lets the parameter
 * carry keywords instead of a number (`_DEBUG=LOG`), which is why the macros in
 * @sasjs/core send `_debug=log` as readily as `_debug=131`.
 */
export const DEBUG_ON = 131

/**
 * Normalises the `_debug` query parameter.
 *
 * A number is taken as it is; any other non-empty value means "return the
 * session log" and becomes 131. The parameter has one effect behind it - whether
 * the log comes back - so there is no per-keyword behaviour to preserve, and a
 * name that SAS would not recognise still expresses the caller's intent.
 *
 * Returns undefined for an absent or empty parameter, so "not asked for" stays
 * distinct from "asked for".
 */
export const parseDebugValue = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined

  // NaN and Infinity are not levels; treat them as not asked for rather than
  // letting a comparison against 131 decide
  if (typeof value === 'number')
    return Number.isFinite(value) ? value : undefined

  const text = String(value).trim()

  if (!text) return undefined

  // an integer, which is the only numeric form the macros' `%if &_debug ge 131`
  // test recognises: `1e3` and `0x10` are text, not levels, and Number() would
  // read them as 1000 and 16
  return /^[+-]?\d+$/.test(text) ? Number(text) : DEBUG_ON
}
