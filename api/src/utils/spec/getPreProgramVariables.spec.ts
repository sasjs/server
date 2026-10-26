import { Request } from 'express'
import { getPreProgramVariables } from '../getPreProgramVariables'

const request = (overrides: Partial<Record<string, unknown>> = {}) =>
  ({
    protocol: 'https',
    get: () => 'sas.example.com',
    headers: {},
    cookies: {},
    ...overrides
  }) as unknown as Request

const ENV = [
  'HTTP_PORT',
  'HTTPS_PORT',
  'HTTP_BIND_ADDRESS',
  'HTTP_ALLOW_REMOTE',
  'HTTPS_BIND_ADDRESS',
  'CERT_CHAIN',
  'PRIVATE_KEY',
  'PROTOCOL',
  'PORT'
]

describe('getPreProgramVariables', () => {
  const saved: NodeJS.ProcessEnv = {}

  beforeEach(() => {
    ENV.forEach((key) => {
      saved[key] = process.env[key]
      delete process.env[key]
    })
  })

  afterEach(() => {
    ENV.forEach((key) => {
      if (saved[key] === undefined) delete process.env[key]
      else process.env[key] = saved[key]
    })
  })

  describe('_sasjs_apiserverurl', () => {
    it('should prefer the plain HTTP listener, whatever the request arrived on', () => {
      process.env.HTTP_PORT = '5000'

      // an https request on the public name: the callback still goes to loopback,
      // so the SAS session never has to trust this server's certificate
      const { serverUrl } = getPreProgramVariables(request())

      expect(serverUrl).toEqual('http://127.0.0.1:5000')
    })

    it('should use loopback when the plain listener binds every interface', () => {
      process.env.HTTP_PORT = '5000'
      process.env.HTTP_BIND_ADDRESS = '0.0.0.0'
      process.env.HTTP_ALLOW_REMOTE = 'true'

      expect(getPreProgramVariables(request()).serverUrl).toEqual(
        'http://127.0.0.1:5000'
      )
    })

    it('should use the interface the plain listener is bound to', () => {
      process.env.HTTP_PORT = '8080'
      process.env.HTTP_BIND_ADDRESS = '192.168.1.5'
      process.env.HTTP_ALLOW_REMOTE = 'true'

      expect(getPreProgramVariables(request()).serverUrl).toEqual(
        'http://192.168.1.5:8080'
      )
    })

    it('should bracket an IPv6 bind address in the URL', () => {
      process.env.HTTP_PORT = '5000'
      process.env.HTTP_BIND_ADDRESS = '::1'

      // http://::1:5000 is not parseable; the authority needs brackets
      expect(getPreProgramVariables(request()).serverUrl).toEqual(
        'http://[::1]:5000'
      )
    })

    it('should follow the request when only a TLS listener is enabled', () => {
      process.env.HTTPS_PORT = '443'
      process.env.CERT_CHAIN = './certs/fullchain.pem'
      process.env.PRIVATE_KEY = 'key'

      expect(getPreProgramVariables(request()).serverUrl).toEqual(
        'https://sas.example.com'
      )
    })

    it('should keep the caller identity variables beside the URL', () => {
      process.env.HTTP_PORT = '5000'

      const variables = getPreProgramVariables(
        request({
          user: { username: 'alice', userId: 'u1', displayName: 'Alice' },
          accessToken: 'token',
          cookies: { 'connect.sid': 'sid' }
        })
      )

      expect(variables.username).toEqual('alice')
      expect(variables.displayName).toEqual('Alice')
      expect(variables.httpHeaders).toContain('Authorization: Bearer token')
      expect(variables.httpHeaders).toContain('cookie: connect.sid=sid')
    })
  })
})
