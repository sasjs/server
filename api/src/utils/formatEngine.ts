import { FormatOptions } from '@sasjs/lint'

/** The reprint pass, as `@sasjs/lint` expects it. */
export type Reprint = NonNullable<FormatOptions['reprint']>

/** How the engine is loaded, so a test can supply one instead. */
export type EngineLoader = () => Promise<Reprint>

let engine: Promise<Reprint> | undefined

/**
 * Loads the engine from the package, which is ES modules.
 *
 * `@sasjs/sas-language` publishes ES modules and this package compiles to
 * CommonJS, so the import has to be dynamic; TypeScript compiles it to
 * `require()`, which Node answers for an ES module from 20.19 (and 22.12 by
 * default) because the bundle carries no top-level await.
 */
const fromPackage: EngineLoader = () =>
  import('@sasjs/sas-language/format').then((module) => module.formatText)

/**
 * The SAS layout engine, loaded on first use and kept.
 *
 * It is loaded here rather than imported by the controller for one reason: the
 * server accepts requests before any of it is needed, and paying a module graph on
 * the startup path to format a buffer that may never arrive is the wrong trade for
 * a product whose first impression is how quickly it comes up.
 *
 * Measured: ~25 ms for the module graph, ~38 ms more on the first format while it
 * lexes and loads the vocabulary, then ~2 ms per format.
 *
 * The promise is memoised, so a second request reuses the module and a failed load
 * is not retried on every request. `load` exists for tests - jest's module runtime
 * refuses to require an ES module at all, so a test cannot reach the real one.
 */
export const getFormatEngine = (
  load: EngineLoader = fromPackage
): Promise<Reprint> => (engine ??= load())

/**
 * Loads the engine ahead of the first format request.
 *
 * Called once the server is accepting connections, so the work happens while
 * nobody is waiting for it - a cold first "format document" would otherwise pay
 * both the import and the vocabulary load. Failure is logged and swallowed: a
 * server that cannot format should still serve, and the request path falls back to
 * rules-only formatting when the engine is unavailable.
 */
export const warmFormatEngine = async (load?: EngineLoader): Promise<void> => {
  try {
    await getFormatEngine(load)
  } catch (error: any) {
    process.logger?.warn(
      `[format] the SAS formatter engine could not be loaded: ${error?.message ?? error}`
    )
  }
}
