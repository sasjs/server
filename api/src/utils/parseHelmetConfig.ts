import path from 'path'
import fs from 'fs'

export const getEnvCSPDirectives = (
  HELMET_CSP_CONFIG_PATH: string | undefined
) => {
  let cspConfigJson = {
    'img-src': ["'self'", 'data:'],
    'script-src': ["'self'", "'unsafe-inline'"],
    'script-src-attr': ["'self'", "'unsafe-inline'"]
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
        console.error(
          'Parsing Content Security Policy JSON config failed. Make sure it is valid json'
        )
      }
    } catch (e) {
      console.error('Error reading HELMET CSP config file', e)
    }
  }

  return cspConfigJson
}
