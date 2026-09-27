import path from 'path'
import { createHash } from 'crypto'
import { readFile } from '@sasjs/utils'

/**
 * How much of the digest travels in the URL. Twelve hex characters is far more
 * than enough to distinguish two builds of one file, and short enough to keep
 * the reference readable.
 */
export const BUNDLE_VERSION_LENGTH = 12

/** The entry bundle the served page references. */
export const BUNDLE_NAME = 'index.bundle.js'

/**
 * The cache-busting token for a bundle's contents.
 *
 * The SPA bundle is served under a fixed name (`index.bundle.js`), so a browser
 * that holds the previous build cached keeps rendering the previous UI after an
 * app update: a login screen went on offering a password form the new server
 * refuses, and only a cache-disabled reload showed the new screen. A token
 * derived from the contents changes with every build and is stable within one,
 * so the browser fetches the new bundle without the user having to know.
 */
export const bundleVersionFor = (bundle: string): string =>
  createHash('sha256')
    .update(bundle)
    .digest('hex')
    .slice(0, BUNDLE_VERSION_LENGTH)

/**
 * An HTML attribute whose value names a file. The built page writes these
 * unquoted (`src=./index.bundle.js`), but a quoted form is just as valid, so
 * both are matched.
 */
const FILE_ATTRIBUTE = /(\s(?:src|href)=)("[^"]*"|'[^']*'|[^\s>]+)/g

/**
 * The page with its bundle reference carrying that token.
 *
 * Only an attribute that names the bundle is rewritten, so the same words in
 * prose are left as prose. A reference that already carries a query string is
 * left alone too, so applying this twice cannot produce a second `?v=`.
 */
export const withBundleVersion = (html: string, version: string): string =>
  html.replace(FILE_ATTRIBUTE, (match, attribute: string, value: string) => {
    const quote = value[0] === '"' || value[0] === "'" ? value[0] : ''
    const target = quote ? value.slice(1, -1) : value

    if (!target.includes(BUNDLE_NAME) || target.includes('?')) return match

    return `${attribute}${quote}${target}?v=${version}${quote}`
  })

/**
 * The version already computed for a bundle path. A build's contents do not
 * change while the process runs, so the digest is computed once rather than on
 * every page load - the bundle is megabytes.
 */
const versions = new Map<string, string>()

/**
 * The page at `htmlPath`, with its bundle reference versioned by the bundle's
 * contents.
 *
 * A page with no bundle beside it is returned as it is: a missing cache token
 * costs a stale bundle at worst, so it must never be the reason a deployment
 * cannot render its own app.
 */
export const webPageWithBundleVersion = async (
  htmlPath: string
): Promise<string> => {
  const html = await readFile(htmlPath)
  const bundlePath = path.join(path.dirname(htmlPath), BUNDLE_NAME)

  let version = versions.get(bundlePath)

  if (!version) {
    try {
      version = bundleVersionFor(await readFile(bundlePath))
    } catch {
      return html
    }

    versions.set(bundlePath, version)
  }

  return withBundleVersion(html, version)
}
