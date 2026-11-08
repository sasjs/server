import path from 'path'
import fs from 'fs'

/**
 * The default Content-Security-Policy directives.
 *
 * No `'unsafe-inline'` on `script-src` or `script-src-attr`: the app's pages
 * carry no inline script and no inline event handlers, so an injected script
 * is refused rather than permitted. `style-src` keeps helmet's own
 * `'unsafe-inline'`, which the styling libraries the SPA uses require.
 *
 * An application deployed on the server that depends on inline scripts or
 * inline event handlers loosens this by pointing HELMET_CSP_CONFIG_PATH at a
 * config file of its own. The file LAYERS OVER these defaults, per directive:
 * a directive the file omits keeps the value below.
 */
export const getEnvCSPDirectives = (
  HELMET_CSP_CONFIG_PATH: string | undefined
) => {
  // `blob:` is load-bearing: the Studio previews a drive image by fetching it
  // and handing the page an object URL, and without it the browser refuses to
  // draw any picture - the pane is simply empty. A blob: URL is minted by the
  // page itself and carries no remote origin, so allowing it adds no way to
  // fetch content the policy otherwise refuses.
  //
  // `frame-src 'self'` is load-bearing too, in a subtler way: the API screen
  // frames the server's own documentation page (/SASjsApi/). A policy that
  // states a `default-src` and no `frame-src` makes the frame inherit that
  // default, so a deployment whose default-src is narrower than its own origin
  // - or invalid, as `'all'` is, since it is not a CSP keyword - leaves the
  // pane blank while the page itself answers 200. Framing the server's own
  // origin is what the app does, so it says so here rather than depending on a
  // fallback.
  const defaults: { [key: string]: string[] | null } = {
    'img-src': ["'self'", 'data:', 'blob:'],
    'frame-src': ["'self'"],
    'script-src': ["'self'"],
    'script-src-attr': ["'none'"]
  }

  if (
    typeof HELMET_CSP_CONFIG_PATH !== 'string' ||
    HELMET_CSP_CONFIG_PATH.length === 0
  )
    return defaults

  const cspConfigPath = path.join(process.cwd(), HELMET_CSP_CONFIG_PATH)
  let file: string

  try {
    file = fs.readFileSync(cspConfigPath).toString()
  } catch (e) {
    process.logger.error('Error reading HELMET CSP config file', e)

    return defaults
  }

  let fromFile: { [key: string]: string[] | null }

  try {
    fromFile = JSON.parse(file)
  } catch (e) {
    process.logger.error(
      'Parsing Content Security Policy JSON config failed. Make sure it is valid json'
    )

    // Log what is in force, because the file the operator edited is not.
    process.logger.info(
      `Content Security Policy in force: ${JSON.stringify(defaults)}`
    )

    return defaults
  }

  // Merged, not replaced. A file states the directives an application needs to
  // loosen, and replacing the defaults with it silently drops the ones the
  // server itself depends on - `img-src` with `blob:` (the Studio's image
  // preview) and `frame-src` with `'self'` (the API screen) both disappear the
  // moment a file does not mention them, and helmet's own defaults then take
  // over. The operator's value still wins for any directive it names.
  const directives = { ...defaults, ...fromFile }

  process.logger.info(
    `Content Security Policy from ${cspConfigPath}: ${JSON.stringify(directives)}`
  )

  return directives
}
