import {
  resolveListeners,
  DEFAULT_HTTP_BIND_ADDRESS
} from '../resolveListeners'

const TLS = { CERT_CHAIN: './certs/fullchain.pem', PRIVATE_KEY: 'key' }

const resolve = (env: NodeJS.ProcessEnv) =>
  resolveListeners(env as NodeJS.ProcessEnv)

describe('resolveListeners', () => {
  describe('enabling a listener', () => {
    it('should enable only the plain HTTP listener when only HTTP_PORT is set', () => {
      const { config, errors } = resolve({ HTTP_PORT: '5000' })

      expect(errors).toEqual([])
      expect(config).toEqual({
        httpPort: 5000,
        httpsPort: 0,
        httpBindAddress: DEFAULT_HTTP_BIND_ADDRESS,
        httpsBindAddress: undefined
      })
    })

    it('should enable only the TLS listener when only HTTPS_PORT is set', () => {
      const { config, errors } = resolve({ HTTPS_PORT: '443', ...TLS })

      expect(errors).toEqual([])
      expect(config?.httpPort).toBe(0)
      expect(config?.httpsPort).toBe(443)
    })

    it('should enable both listeners when both ports are set', () => {
      const { config, errors } = resolve({
        HTTP_PORT: '5000',
        HTTPS_PORT: '443',
        HTTP_BIND_ADDRESS: '0.0.0.0',
        HTTP_ALLOW_REMOTE: 'true',
        HTTPS_BIND_ADDRESS: '192.168.1.10',
        ...TLS
      })

      expect(errors).toEqual([])
      expect(config).toEqual({
        httpPort: 5000,
        httpsPort: 443,
        httpBindAddress: '0.0.0.0',
        httpsBindAddress: '192.168.1.10'
      })
    })

    it('should treat an empty value as disabled, the same as unset', () => {
      const { config, errors } = resolve({
        HTTP_PORT: '   ',
        HTTPS_PORT: '443',
        ...TLS
      })

      expect(errors).toEqual([])
      expect(config?.httpPort).toBe(0)
      expect(config?.httpsPort).toBe(443)
    })

    it('should treat 0 as disabled', () => {
      const { config, errors } = resolve({
        HTTP_PORT: '0',
        HTTPS_PORT: '443',
        ...TLS
      })

      expect(errors).toEqual([])
      expect(config?.httpPort).toBe(0)
    })
  })

  describe('refusing to start', () => {
    it('should refuse when neither port is set, naming both variables', () => {
      const { config, errors } = resolve({})

      expect(config).toBeNull()
      expect(errors.join('\n')).toContain('HTTP_PORT and/or HTTPS_PORT')
    })

    it('should refuse a non-numeric port, naming the variable', () => {
      const { config, errors } = resolve({ HTTP_PORT: 'fifty' })

      expect(config).toBeNull()
      expect(errors.join('\n')).toContain("HTTP_PORT 'fifty'")
    })

    it('should refuse a port above the valid range', () => {
      const { config, errors } = resolve({ HTTP_PORT: '70000' })

      expect(config).toBeNull()
      expect(errors.join('\n')).toContain('between 0 and 65535')
    })

    it('should refuse two listeners on the same port', () => {
      const { config, errors } = resolve({
        HTTP_PORT: '8443',
        HTTPS_PORT: '8443',
        ...TLS
      })

      expect(config).toBeNull()
      expect(errors.join('\n')).toContain('must differ')
    })

    it('should refuse HTTPS_PORT without a certificate chain, naming it', () => {
      const { config, errors } = resolve({
        HTTPS_PORT: '443',
        PRIVATE_KEY: 'key'
      })

      expect(config).toBeNull()
      expect(errors.join('\n')).toContain('CERT_CHAIN is required')
    })

    it('should refuse HTTPS_PORT without a private key, naming it', () => {
      const { config, errors } = resolve({
        HTTPS_PORT: '443',
        CERT_CHAIN: './certs/fullchain.pem'
      })

      expect(config).toBeNull()
      expect(errors.join('\n')).toContain('PRIVATE_KEY is required')
    })

    it('should refuse a plain HTTP listener on a non-loopback address without the opt-in', () => {
      const { config, errors } = resolve({
        HTTP_PORT: '5000',
        HTTP_BIND_ADDRESS: '0.0.0.0'
      })

      expect(config).toBeNull()
      expect(errors.join('\n')).toContain('HTTP_ALLOW_REMOTE=true')
    })

    it('should allow a plain HTTP listener on a non-loopback address with the opt-in', () => {
      const { config, errors } = resolve({
        HTTP_PORT: '5000',
        HTTP_BIND_ADDRESS: '0.0.0.0',
        HTTP_ALLOW_REMOTE: 'true'
      })

      expect(errors).toEqual([])
      expect(config?.httpBindAddress).toBe('0.0.0.0')
    })

    it('should not require TLS material when only plain HTTP is enabled', () => {
      const { config, errors } = resolve({ HTTP_PORT: '5000' })

      expect(errors).toEqual([])
      expect(config?.httpsPort).toBe(0)
    })
  })

  describe('the legacy PROTOCOL and PORT shim', () => {
    it('should map PROTOCOL=https and PORT to HTTPS_PORT with a deprecation warning', () => {
      const { config, warnings, errors } = resolve({
        PROTOCOL: 'https',
        PORT: '443',
        ...TLS
      })

      expect(errors).toEqual([])
      expect(config?.httpsPort).toBe(443)
      expect(config?.httpPort).toBe(0)
      expect(warnings.join('\n')).toContain('deprecated')
      expect(warnings.join('\n')).toContain('HTTPS_PORT=443')
    })

    it('should map PROTOCOL=http and PORT to HTTP_PORT with a deprecation warning', () => {
      const { config, warnings, errors } = resolve({
        PROTOCOL: 'http',
        PORT: '5000'
      })

      expect(errors).toEqual([])
      expect(config?.httpPort).toBe(5000)
      expect(warnings.join('\n')).toContain('HTTP_PORT=5000')
    })

    it('should let the new variables win over the legacy ones, and say so', () => {
      const { config, warnings, errors } = resolve({
        HTTP_PORT: '5000',
        PROTOCOL: 'https',
        PORT: '443',
        ...TLS
      })

      expect(errors).toEqual([])
      expect(config?.httpPort).toBe(5000)
      expect(config?.httpsPort).toBe(0)
      // silence would let an operator believe the PROTOCOL=https beside the port
      // variable is still what the deployment serves
      expect(warnings.join('\n')).toContain('ignored')
    })

    it('should keep PROTOCOL=http meaning the old default port when PORT is unset', () => {
      const { config, warnings, errors } = resolve({ PROTOCOL: 'http' })

      expect(errors).toEqual([])
      expect(config?.httpPort).toBe(5000)
      expect(warnings.join('\n')).toContain('HTTP_PORT=5000')
    })

    it('should not warn about legacy variables when none are set', () => {
      const { warnings, errors } = resolve({ HTTP_PORT: '5000' })

      expect(errors).toEqual([])
      expect(warnings).toEqual([])
    })

    it('should refuse PORT without PROTOCOL, naming the replacement', () => {
      const { config, errors } = resolve({ PORT: '5000' })

      expect(config).toBeNull()
      expect(errors.join('\n')).toContain('PROTOCOL is not')
      expect(errors.join('\n')).toContain('HTTP_PORT=5000')
    })

    it('should refuse an unknown PROTOCOL', () => {
      const { config, errors } = resolve({ PROTOCOL: 'ftp', PORT: '21' })

      expect(config).toBeNull()
      expect(errors.join('\n')).toContain("PROTOCOL 'ftp'")
    })
  })
})
