/** Normalize tier query names, preserving raw values and all occurrences so the
 * destination API validates duplicates rather than silently selecting one.
 */
export const normalizeTierQuery = (url: string, preserveInputs = false) => {
  const queryStart = url.indexOf('?')
  const pairs = queryStart < 0 ? [] : url.slice(queryStart + 1).split('&')
  const names: Record<string, string> = {
    _file: '_FILE',
    _filepath: '_filePath',
    _program: '_program',
    _debug: '_debug'
  }
  let hasFile = false
  let hasProgram = false
  const normalized = pairs.map((pair) => {
    if (!pair) return pair
    const separator = pair.indexOf('=')
    const rawKey = separator < 0 ? pair : pair.slice(0, separator)
    const decoded = new URLSearchParams(`${rawKey}=`).keys().next().value ?? ''
    const key = decoded.toLowerCase()
    const name = Object.prototype.hasOwnProperty.call(names, key)
      ? names[key]
      : preserveInputs
        ? decoded
        : key
    if (name === '_FILE') hasFile = true
    if (name === '_program') hasProgram = true
    return (
      encodeURIComponent(name) + (separator < 0 ? '' : pair.slice(separator))
    )
  })
  return {
    search: queryStart < 0 ? '' : `?${normalized.join('&')}`,
    hasFile,
    hasProgram
  }
}
