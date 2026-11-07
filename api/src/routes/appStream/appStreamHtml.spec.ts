import { appStreamHtml } from './appStreamHtml'

/**
 * The app stream page is served under the default Content-Security-Policy,
 * which refuses inline event handlers (`script-src-attr 'none'`) and inline
 * script tags. Any behaviour it needs is wired up from
 * `public/app-streams-script.js`, which is loaded with a `src`.
 */
describe('appStreamHtml', () => {
  const html = appStreamHtml({
    someStream: {
      appLoc: '/Public/app/someStream',
      streamLogo: 'logo.png'
    },
    anotherStream: {
      appLoc: '/Public/app/anotherStream'
    }
  } as any)

  it('carries no inline event handlers', () => {
    expect(html).not.toMatch(/\son[a-z]+=/i)
  })

  it('carries no inline script tags', () => {
    expect(html).not.toMatch(/<script(?![^>]*\ssrc=)/i)
  })

  it('declares the fallback logo for the stream script to use', () => {
    expect(html).toContain('data-fallback="/sasjs-logo.svg"')
  })

  it('offers no way to publish an app', () => {
    // Publishing moved to Administration in the web interface. The page stays
    // the path apps are served from, not a place to upload one.
    expect(html).not.toMatch(/Upload New App/i)
    expect(html).not.toMatch(/type="file"/i)
  })
})
