import { Response } from 'express'
import { appStreamCacheHeaders } from './index'

/**
 * What an App Stream app's files tell a browser to cache.
 *
 * The two cases are a deployment apart: a build's hashed files can live in the
 * browser for a year because a new build gives them new names, and everything
 * else - index.html above all - has to come back to the server every time or a
 * browser keeps running the previous deployment's shell against the new bundle.
 */
describe('appStreamCacheHeaders', () => {
  const headersFor = (filePath: string) => {
    const set: { [key: string]: string } = {}
    const res = {
      setHeader: (name: string, value: string) => {
        set[name] = value
      }
    } as unknown as Response

    appStreamCacheHeaders(res, filePath)

    return set
  }

  it('caches a content-hashed build file for a year, immutably', () => {
    expect(headersFor('/drive/files/web/main.9eaa896678041cc0.js')).toEqual({
      'Cache-Control': 'public, max-age=31536000, immutable'
    })
  })

  it('caches a hashed font and a hashed stylesheet the same way', () => {
    expect(
      headersFor('/drive/files/web/styles.5bdb7d12ea179a74.css')[
        'Cache-Control'
      ]
    ).toBe('public, max-age=31536000, immutable')

    expect(
      headersFor('/drive/files/web/Metropolis-400.05446670d27f7666.woff')[
        'Cache-Control'
      ]
    ).toBe('public, max-age=31536000, immutable')
  })

  it('revalidates index.html every time', () => {
    expect(headersFor('/drive/files/web/index.html')).toEqual({
      'Cache-Control': 'public, max-age=0, must-revalidate'
    })
  })

  it('revalidates a name that cannot change under the same hash', () => {
    // An asset a deployment does not fingerprint is editable in place, so it is
    // exactly the file a long cache would pin.
    expect(headersFor('/drive/files/web/assets/config.json')).toEqual({
      'Cache-Control': 'public, max-age=0, must-revalidate'
    })
  })

  it('does not mistake a short hex run for a content hash', () => {
    // `build.1234.js` is a name someone chose, not a fingerprint; treating it as
    // immutable would pin whatever it held for a year.
    expect(headersFor('/drive/files/web/build.1234.js')).toEqual({
      'Cache-Control': 'public, max-age=0, must-revalidate'
    })
  })
})
