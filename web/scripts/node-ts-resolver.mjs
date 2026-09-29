/**
 * Resolve hooks for the test scripts.
 *
 * Two differences between the bundler and plain node are bridged here, so the
 * tests import the real sources unchanged:
 *
 * - The app's TypeScript sources use extensionless relative imports, which the
 *   bundler resolves but node does not. Such a specifier is retried with a .ts
 *   extension.
 * - JSON is imported as a module. webpack reads it without ceremony, while node
 *   demands an import attribute. Loading it here as a module that default-exports
 *   the parsed data matches what the bundler hands the app.
 *
 * Registered by each test script before it imports from ../src.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const tsResolverHooks = {
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
      try {
        return nextResolve(`${specifier}.ts`, context)
      } catch {
        // Fall through to the default resolution.
      }
    }
    return nextResolve(specifier, context)
  },

  load(url, context, nextLoad) {
    if (url.endsWith('.json')) {
      const source = readFileSync(fileURLToPath(url), 'utf8')

      return {
        format: 'module',
        shortCircuit: true,
        source: `export default ${source}`
      }
    }

    return nextLoad(url, context)
  }
}
