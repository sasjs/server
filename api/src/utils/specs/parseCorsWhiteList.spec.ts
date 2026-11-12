import { parseCorsWhiteList } from '../parseCorsWhiteList'

/**
 * The parser is the one definition of what WHITELIST means: validation refuses
 * what it reports as invalid, and the CORS middleware registers the origins it
 * returns. A value that reaches both consumers differently is what let a comma
 * separated list look accepted while the middleware matched nothing.
 */
describe('parseCorsWhiteList', () => {
  it('reads a space separated list', () => {
    expect(
      parseCorsWhiteList('http://one.example.com http://two.example.com')
    ).toEqual({
      origins: ['http://one.example.com', 'http://two.example.com'],
      invalid: []
    })
  })

  it('reads a comma separated list', () => {
    expect(
      parseCorsWhiteList('http://one.example.com,http://two.example.com')
    ).toEqual({
      origins: ['http://one.example.com', 'http://two.example.com'],
      invalid: []
    })
  })

  it('reads a list separated by either, with stray whitespace', () => {
    expect(
      parseCorsWhiteList(
        ' http://one.example.com, http://two.example.com\n\thttp://three.example.com '
      )
    ).toEqual({
      origins: [
        'http://one.example.com',
        'http://two.example.com',
        'http://three.example.com'
      ],
      invalid: []
    })
  })

  it('keeps the port and drops a trailing slash', () => {
    expect(parseCorsWhiteList('http://localhost:3000/')).toEqual({
      origins: ['http://localhost:3000'],
      invalid: []
    })
  })

  it('reports an entry carrying a path or a query as invalid', () => {
    expect(
      parseCorsWhiteList(
        'http://one.example.com/app http://two.example.com/?q=1'
      )
    ).toEqual({
      origins: [],
      invalid: ['http://one.example.com/app', 'http://two.example.com/?q=1']
    })
  })

  it('reports a non-http scheme, or no scheme, as invalid', () => {
    expect(parseCorsWhiteList('ftp://one.example.com localhost:3000')).toEqual({
      origins: [],
      invalid: ['ftp://one.example.com', 'localhost:3000']
    })
  })

  it('reports a wildcard host as invalid', () => {
    expect(parseCorsWhiteList('https://*.example.com')).toEqual({
      origins: [],
      invalid: ['https://*.example.com']
    })
  })

  it('returns nothing for an unset or empty value', () => {
    expect(parseCorsWhiteList(undefined)).toEqual({ origins: [], invalid: [] })
    expect(parseCorsWhiteList('   ')).toEqual({ origins: [], invalid: [] })
    expect(parseCorsWhiteList(',')).toEqual({ origins: [], invalid: [] })
  })
})
