/**
 * The browser origins a CORS-enabled server answers for, read from WHITELIST.
 *
 * The value is a list of origins. Space is the documented separator; a comma is
 * accepted as one too, because a comma cannot appear inside an origin and
 * `http://a,http://b` is the form people reach for. Every entry is then checked
 * to be a bare origin: the CORS middleware compares its entries against the
 * `Origin` header, which a browser sends without a path, a query or a hash, so
 * an entry carrying any of those can never match a real request.
 *
 * The startup validation and the middleware both read WHITELIST through here,
 * so a value the middleware could not use is refused at startup instead of
 * being registered as one allow-list entry that answers nothing.
 */
export const parseCorsWhiteList = (
  value?: string
): { origins: string[]; invalid: string[] } => {
  const origins: string[] = []
  const invalid: string[] = []

  const entries = (value || '')
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter((entry) => !!entry)

  entries.forEach((entry) => {
    let parsed: URL
    try {
      parsed = new URL(entry)
    } catch {
      invalid.push(entry)
      return
    }

    // A bare origin is a scheme and a host, so the parsed URL has nothing but
    // the root path - and `origin` then gives it back normalised (lower case
    // host, no trailing slash), which is the form the middleware compares with.
    // A wildcard host is refused as well: the cors package compares an entry
    // against the request's Origin literally, so `https://*.example.com` would
    // match nothing and leave the same unanswered allow-list behind.
    const isBareOrigin =
      parsed.pathname === '/' && !parsed.search && !parsed.hash
    const isHttp = ['http:', 'https:'].includes(parsed.protocol)
    const hasWildcardHost = parsed.hostname.includes('*')

    if (!isBareOrigin || !isHttp || hasWildcardHost) invalid.push(entry)
    else if (!origins.includes(parsed.origin)) origins.push(parsed.origin)
  })

  return { origins, invalid }
}
