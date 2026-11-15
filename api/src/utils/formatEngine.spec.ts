/**
 * Guards the two properties the formatter engine's loader exists for: it is not
 * loaded until something asks, and it is loaded once.
 *
 * The first is why the loader is not an import at the top of the controller - a
 * server whose first impression is how quickly it comes up should not pay a module
 * graph for a buffer that may never arrive. `require.cache` is the honest way to
 * observe that: it records what this process has actually loaded, not what the
 * source looks like.
 *
 * The engine itself is stubbed here. jest's module runtime refuses to require an
 * ES module (createRequireEsmError), so the real loader cannot run under it; what
 * this file owns is the loader's contract, and the formatting is covered by the
 * engine's own suite.
 */
import { getFormatEngine, warmFormatEngine } from './formatEngine'

const engineIsLoaded = () =>
  Object.keys(require.cache).some((path) =>
    path.includes('@sasjs/sas-language')
  )

describe('formatEngine', () => {
  it('is not loaded when the module is imported', () => {
    expect(engineIsLoaded()).toBe(false)
  })

  it('loads once, and hands back the engine it was given', async () => {
    // One loader for both properties: the memoised promise is process-wide, so a
    // second case cannot own a second loader - it would be handed the first one's.
    // The formatter calls the reprint with the configuration's `keywordCase`, so
    // the value has to arrive at the engine unchanged.
    const seen: string[] = []
    const load = jest.fn(async () => async (text: string, options: any) => {
      seen.push(options.keywordCase)
      return text
    })

    const first = getFormatEngine(load)
    const second = getFormatEngine(load)

    expect(second).toBe(first)
    expect(load).toHaveBeenCalledTimes(1)

    const reprint = await first
    await reprint('data foo;\n', { keywordCase: 'lower' })

    expect(seen).toEqual(['lower'])
  })

  it('warm-up resolves even when the engine cannot be loaded', async () => {
    // A server that cannot format should still serve; the request path falls back.
    const load = async () => {
      throw new Error('module not found')
    }

    await expect(warmFormatEngine(load)).resolves.toBeUndefined()
  })
})
