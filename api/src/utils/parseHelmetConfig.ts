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
 * config file of its own.
 */
export const getEnvCSPDirectives = (
  HELMET_CSP_CONFIG_PATH: string | undefined
) => {
  // `blob:` is load-bearing: the Studio previews a drive image by fetching it
  // and handing the page an object URL, and without it the browser refuses to
  // draw any picture - the pane is simply empty. A blob: URL is minted by the
  // page itself and carries no remote origin, so allowing it adds no way to
  // fetch content the policy otherwise refuses.
  let cspConfigJson = {
    'img-src': ["'self'", 'data:', 'blob:'],
    'script-src': ["'self'"],
    'script-src-attr': ["'none'"]
  }

  if (
    typeof HELMET_CSP_CONFIG_PATH === 'string' &&
    HELMET_CSP_CONFIG_PATH.length > 0
  ) {
    const cspConfigPath = path.join(process.cwd(), HELMET_CSP_CONFIG_PATH)

    try {
      let file = fs.readFileSync(cspConfigPath).toString()

      try {
        cspConfigJson = JSON.parse(file)
      } catch (e) {
        process.logger.error(
          'Parsing Content Security Policy JSON config failed. Make sure it is valid json'
        )
      }
    } catch (e) {
      process.logger.error('Error reading HELMET CSP config file', e)
    }
  }

  return cspConfigJson
}
