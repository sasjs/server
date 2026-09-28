/**
 * Resolve hooks for the test scripts.
 *
 * The app's TypeScript sources use extensionless relative imports, which the
 * bundler resolves but node does not. This hook retries such a specifier with a
 * .ts extension so the tests can import the real sources unchanged.
 *
 * Registered by each test script before it imports from ../src.
 */
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
  }
}
