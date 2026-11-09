import { Response } from 'express'

import { applyAppFraming, frameAncestorsSources } from '../appStreamFraming'

/**
 * A header-juggling helper is worth pinning: the failure mode is silent, and it
 * is a security failure when it happens - an app that asked to be framed by one
 * origin ends up framed by everyone, or by no one.
 */
describe('app stream per-app framing', () => {
  const serverPolicy =
    "default-src 'self'; frame-ancestors 'self'; script-src 'self'"

  const mockRes = (headers: Record<string, string> = {}) => {
    const store: Record<string, string> = { ...headers }

    const res = {
      getHeader: (name: string) => store[name.toLowerCase()],
      setHeader: (name: string, value: string) => {
        store[name.toLowerCase()] = value
      },
      removeHeader: (name: string) => {
        delete store[name.toLowerCase()]
      }
    } as unknown as Response

    return { res, store }
  }

  describe('the sources an entry asks for', () => {
    it('takes one origin', () => {
      expect(frameAncestorsSources('https://portal.example.com')).toEqual([
        'https://portal.example.com'
      ])
    })

    it('takes a list', () => {
      expect(
        frameAncestorsSources([
          'https://one.example.com',
          'https://two.example.com'
        ])
      ).toEqual(['https://one.example.com', 'https://two.example.com'])
    })

    it('names nothing when the entry says nothing', () => {
      expect(frameAncestorsSources(undefined)).toEqual([])
      expect(frameAncestorsSources('')).toEqual([])
      expect(frameAncestorsSources([])).toEqual([])
    })

    it('drops blanks rather than writing an empty source into the policy', () => {
      expect(frameAncestorsSources(['  ', 'https://k.example.com'])).toEqual([
        'https://k.example.com'
      ])
    })
  })

  describe('applying it to a response', () => {
    it('leaves the server policy untouched when the app asks for nothing', () => {
      const { res, store } = mockRes({
        'content-security-policy': serverPolicy,
        'x-frame-options': 'SAMEORIGIN'
      })

      applyAppFraming(res, undefined)

      expect(store['content-security-policy']).toBe(serverPolicy)
      expect(store['x-frame-options']).toBe('SAMEORIGIN')
    })

    it('replaces frame-ancestors without disturbing the other directives', () => {
      const { res, store } = mockRes({
        'content-security-policy': serverPolicy
      })

      applyAppFraming(res, 'https://portal.example.com')

      expect(store['content-security-policy']).toBe(
        "default-src 'self'; script-src 'self'; frame-ancestors https://portal.example.com"
      )
    })

    it('drops X-Frame-Options, which cannot express the origins named', () => {
      const { res, store } = mockRes({
        'content-security-policy': serverPolicy,
        'x-frame-options': 'SAMEORIGIN'
      })

      applyAppFraming(res, 'https://portal.example.com')

      expect(store['x-frame-options']).toBeUndefined()
    })

    it('widens, and can narrow back to a single named origin', () => {
      const { res, store } = mockRes({
        'content-security-policy': serverPolicy
      })

      applyAppFraming(res, [
        'https://one.example.com',
        'https://two.example.com'
      ])

      expect(store['content-security-policy']).toContain(
        'frame-ancestors https://one.example.com https://two.example.com'
      )
    })

    it("keeps a policy of 'self' when the app names 'self'", () => {
      const { res, store } = mockRes({
        'content-security-policy': serverPolicy
      })

      applyAppFraming(res, "'self'")

      expect(store['content-security-policy']).toContain(
        "frame-ancestors 'self'"
      )
    })

    it('does not strip X-Frame-Options when there is no policy to narrow', () => {
      const { res, store } = mockRes({ 'x-frame-options': 'SAMEORIGIN' })

      applyAppFraming(res, 'https://portal.example.com')

      // removing it here would allow framing by anyone, since nothing else says
      // which origins are allowed
      expect(store['x-frame-options']).toBe('SAMEORIGIN')
    })
  })
})
