import {
  verifyEnvVariables,
  ReturnCode,
  getAuthProviders,
  isAuthProviderEnabled,
  AuthProviderType,
  ModeType
} from '../verifyEnvVariables'

// AUTH_PROVIDERS validation is skipped when NODE_ENV is 'test', so the tests
// that exercise it temporarily switch NODE_ENV and restore it afterwards.
const managedEnvVars = [
  'MODE',
  'NODE_ENV',
  'DB_CONNECT',
  'AUTH_PROVIDERS',
  'RUN_TIMES',
  'NODE_PATH',
  'LDAP_URL',
  'LDAP_BIND_DN',
  'LDAP_BIND_PASSWORD',
  'LDAP_USERS_BASE_DN',
  'LDAP_GROUPS_BASE_DN',
  'OIDC_ISSUER_URL',
  'OIDC_DISCOVERY_URL',
  'OIDC_CLIENT_ID',
  'OIDC_CLIENT_SECRET',
  'OIDC_REDIRECT_URI',
  'OIDC_SIGNING_ALG',
  'OIDC_SCOPE',
  'OIDC_PROVIDER_NAME',
  'OIDC_USERNAME_CLAIM',
  'OIDC_JIT_PROVISION',
  'OIDC_POST_LOGOUT_REDIRECT_URI'
]

let originalEnv: { [key: string]: string | undefined }

const restoreEnv = () => {
  managedEnvVars.forEach((key) => {
    if (originalEnv[key] === undefined) delete process.env[key]
    else process.env[key] = originalEnv[key]
  })
}

const setValidServerEnv = () => {
  process.env.MODE = ModeType.Server
  process.env.DB_CONNECT = 'mongodb://localhost:27017/test'
  process.env.RUN_TIMES = 'js'
  process.env.NODE_PATH = '/some/path/to/node'
}

const setValidLdapEnv = () => {
  process.env.LDAP_URL = 'ldaps://ldap.example.com:636'
  process.env.LDAP_BIND_DN = 'cn=admin,ou=system,dc=example'
  process.env.LDAP_BIND_PASSWORD = 'bind-secret'
  process.env.LDAP_USERS_BASE_DN = 'ou=users,dc=example'
  process.env.LDAP_GROUPS_BASE_DN = 'ou=groups,dc=example'
}

const setValidOidcEnv = () => {
  process.env.OIDC_ISSUER_URL = 'https://id.example.com/openid'
  process.env.OIDC_CLIENT_ID = 'sasjs-server'
  process.env.OIDC_CLIENT_SECRET = 'oidc-client-secret'
  process.env.OIDC_REDIRECT_URI =
    'https://sas.example.com/SASLogon/openid/callback'
}

describe('verifyEnvVariables', () => {
  beforeEach(() => {
    originalEnv = { ...process.env }
    // NODE_ENV must not be 'test' for the AUTH_PROVIDERS branch to run.
    process.env.NODE_ENV = 'development'
    setValidServerEnv()
  })

  afterEach(() => {
    restoreEnv()
  })

  describe('AUTH_PROVIDERS parsing', () => {
    it('should parse a space separated list', () => {
      process.env.AUTH_PROVIDERS = 'ldap oidc'
      expect(getAuthProviders()).toEqual(['ldap', 'oidc'])
    })

    it('should parse a comma separated list', () => {
      process.env.AUTH_PROVIDERS = 'ldap,oidc'
      expect(getAuthProviders()).toEqual(['ldap', 'oidc'])
    })

    it('should normalise case and tolerate surrounding whitespace', () => {
      process.env.AUTH_PROVIDERS = '  LDAP   OIDC  '
      expect(getAuthProviders()).toEqual(['ldap', 'oidc'])
    })

    it('should return an empty list when unset', () => {
      delete process.env.AUTH_PROVIDERS
      expect(getAuthProviders()).toEqual([])
    })

    it('should report which providers are enabled', () => {
      process.env.AUTH_PROVIDERS = 'ldap oidc'
      expect(isAuthProviderEnabled(AuthProviderType.LDAP)).toEqual(true)
      expect(isAuthProviderEnabled(AuthProviderType.OIDC)).toEqual(true)

      process.env.AUTH_PROVIDERS = 'oidc'
      expect(isAuthProviderEnabled(AuthProviderType.LDAP)).toEqual(false)
      expect(isAuthProviderEnabled(AuthProviderType.OIDC)).toEqual(true)
    })
  })

  describe('AUTH_PROVIDERS validation', () => {
    it('should accept a single provider', () => {
      process.env.AUTH_PROVIDERS = 'ldap'
      setValidLdapEnv()

      expect(verifyEnvVariables()).toEqual(ReturnCode.Success)
    })

    it('should accept more than one provider', () => {
      process.env.AUTH_PROVIDERS = 'ldap oidc'
      setValidLdapEnv()
      setValidOidcEnv()

      expect(verifyEnvVariables()).toEqual(ReturnCode.Success)
    })

    it('should reject an unrecognised provider in the list', () => {
      process.env.AUTH_PROVIDERS = 'ldap bogus'
      setValidLdapEnv()

      expect(verifyEnvVariables()).toEqual(ReturnCode.InvalidEnv)
    })
  })

  describe('OIDC variables', () => {
    beforeEach(() => {
      process.env.AUTH_PROVIDERS = 'oidc'
      setValidOidcEnv()
    })

    it('should accept a valid OIDC configuration', () => {
      expect(verifyEnvVariables()).toEqual(ReturnCode.Success)
    })

    it('should apply the documented defaults', () => {
      expect(verifyEnvVariables()).toEqual(ReturnCode.Success)

      expect(process.env.OIDC_SIGNING_ALG).toEqual('RS256')
      expect(process.env.OIDC_SCOPE).toEqual('openid profile email')
      expect(process.env.OIDC_PROVIDER_NAME).toEqual('OpenID Connect')
      expect(process.env.OIDC_USERNAME_CLAIM).toEqual('preferred_username')
      expect(process.env.OIDC_JIT_PROVISION).toEqual('true')
    })

    it('should require a client id', () => {
      delete process.env.OIDC_CLIENT_ID

      expect(verifyEnvVariables()).toEqual(ReturnCode.InvalidEnv)
    })

    it('should require a client secret', () => {
      delete process.env.OIDC_CLIENT_SECRET

      expect(verifyEnvVariables()).toEqual(ReturnCode.InvalidEnv)
    })

    it('should require a redirect URI', () => {
      delete process.env.OIDC_REDIRECT_URI

      expect(verifyEnvVariables()).toEqual(ReturnCode.InvalidEnv)
    })

    it('should require an issuer or a discovery URL', () => {
      delete process.env.OIDC_ISSUER_URL

      expect(verifyEnvVariables()).toEqual(ReturnCode.InvalidEnv)

      process.env.OIDC_DISCOVERY_URL =
        'https://id.example.com/openid/.well-known/openid-configuration'
      expect(verifyEnvVariables()).toEqual(ReturnCode.Success)
    })

    it('should reject a relative redirect URI', () => {
      process.env.OIDC_REDIRECT_URI = '/SASLogon/openid/callback'

      expect(verifyEnvVariables()).toEqual(ReturnCode.InvalidEnv)
    })

    it('should reject an unsupported signing algorithm', () => {
      process.env.OIDC_SIGNING_ALG = 'HS256'

      expect(verifyEnvVariables()).toEqual(ReturnCode.InvalidEnv)
    })

    it('should reject a scope without openid', () => {
      process.env.OIDC_SCOPE = 'profile email'

      expect(verifyEnvVariables()).toEqual(ReturnCode.InvalidEnv)
    })

    it('should reject a non-boolean OIDC_JIT_PROVISION', () => {
      process.env.OIDC_JIT_PROVISION = 'yes'

      expect(verifyEnvVariables()).toEqual(ReturnCode.InvalidEnv)
    })

    it('should not validate OIDC variables when the provider is not enabled', () => {
      process.env.AUTH_PROVIDERS = 'ldap'
      setValidLdapEnv()
      delete process.env.OIDC_CLIENT_ID

      expect(verifyEnvVariables()).toEqual(ReturnCode.Success)
    })

    it('should not validate OIDC variables in desktop mode', () => {
      process.env.MODE = ModeType.Desktop
      delete process.env.OIDC_CLIENT_ID

      expect(verifyEnvVariables()).toEqual(ReturnCode.Success)
    })
  })
})
