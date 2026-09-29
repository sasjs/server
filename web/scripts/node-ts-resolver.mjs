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
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// The load hook's generated ESM wrappers read the wrapped CJS modules from
// this registry; it lives on globalThis so the wrappers can reach it.
globalThis.__cjsBridge = globalThis.__cjsBridge ?? new Map()

export const tsResolverHooks = {
  // The CJS modules the load hook wraps register their live exports here,
  // keyed by URL, so the generated ESM wrapper hands out the real objects
  // rather than a serialization of them.
  cjsBridge: new Map(),
  resolve(specifier, context, nextResolve) {
    // The protocol package's browser entry is published under the browser
    // condition only, which node refuses to load. The file is what the
    // browser resolves, and it is plain JS with no browser-only API, so the
    // node tests read it by path - the same job the bundler's browser
    // condition does.
    if (specifier === 'vscode-languageserver-protocol/browser') {
      return {
        url: pathToFileURL(
          fileURLToPath(
            new URL(
              '../node_modules/vscode-languageserver-protocol/lib/browser/main.js',
              import.meta.url
            )
          )
        ).href,
        shortCircuit: true
      }
    }
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

    // The protocol and jsonrpc browser entries are CommonJS, published under
    // the browser condition only. The bundler applies its own interop; under
    // node the named imports need an ESM wrapper. Each file is evaluated here
    // with a fresh module object, so loading never re-enters the loader for
    // the same URL (which would be a cycle).
    if (
      url.endsWith('vscode-languageserver-protocol/lib/browser/main.js') ||
      url.endsWith('vscode-jsonrpc/lib/browser/main.js')
    ) {
      const source = readFileSync(fileURLToPath(url), 'utf8')
      const moduleExports = { exports: {} }

      // A module wrapper shaped like node's own, so the file's require
      // calls resolve relative to the file.
      const fn = new Function(
        'exports',
        'module',
        'require',
        '__filename',
        '__dirname',
        source
      )
      const wrappedRequire = createRequire(url)

      /**
       * Evaluates a CJS browser entry in this sandbox, so its load never
       * re-enters node's loader: require(esm) interop would otherwise hand
       * back a sentinel object instead of the module's named exports, and
       * an ESM-load of a file mid-CJS-evaluation is a cycle. The live
       * exports object is returned, so classes stay constructors.
       */
      const evaluate = (file) => {
        const fileUrl = pathToFileURL(file).href

        if (tsResolverHooks.cjsBridge.has(fileUrl)) {
          return tsResolverHooks.cjsBridge.get(fileUrl)
        }

        const exports = { exports: {} }
        const sandboxRequire = createRequire(fileUrl)

        new Function(
          'exports',
          'module',
          'require',
          '__filename',
          '__dirname',
          readFileSync(file, 'utf8')
        )(exports.exports, exports, sandboxRequire, file, path.dirname(file))

        tsResolverHooks.cjsBridge.set(fileUrl, exports.exports)
        globalThis.__cjsBridge.set(fileUrl, exports.exports)

        return exports.exports
      }

      const require = (specifier) => {
        // The sibling browser entries resolve by path, past their exports
        // maps, which publish them under the browser condition only.
        if (specifier === 'vscode-jsonrpc/browser') {
          // The package sits beside the protocol package in node_modules;
          // its exports map gates every subpath, including package.json.
          const jsonrpcRoot = path.resolve(
            path.dirname(fileURLToPath(url)),
            '../../../vscode-jsonrpc'
          )
          return evaluate(`${jsonrpcRoot}/lib/browser/main.js`)
        }

        return wrappedRequire(specifier)
      }
      fn(
        moduleExports.exports,
        moduleExports,
        require,
        fileURLToPath(url),
        fileURLToPath(new URL('.', url))
      )

      const named = moduleExports.exports

      tsResolverHooks.cjsBridge.set(url, named)
      globalThis.__cjsBridge.set(url, named)

      return {
        format: 'module',
        shortCircuit: true,
        source: `const module = globalThis.__cjsBridge.get(${JSON.stringify(
          url
        )})
export const BrowserMessageReader = module.BrowserMessageReader
export const BrowserMessageWriter = module.BrowserMessageWriter
export const createProtocolConnection = module.createProtocolConnection
export default module
`
      }
    }

    return nextLoad(url, context)
  }
}
