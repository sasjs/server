import {
  verifyEnvVariables,
  verifyRunAs,
  ReturnCode,
  getAuthProviders,
  isAuthProviderEnabled,
  isLocalLoginEnabled,
  AuthProviderType,
  ModeType
} from '../verifyEnvVariables'
import { userInfo } from 'os'

// AUTH_PROVIDERS validation is skipped when NODE_ENV is 'test', so the tests
// that exercise it temporarily switch NODE_ENV and restore it afterwards.
const managedEnvVars = [
  'MODE',
  'NODE_ENV',
  'DB_CONNECT',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD_INITIAL',
  'AUTH_PROVIDERS',
  'LOCAL_LOGIN_ENABLED',
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
  'OIDC_POST_LOGOUT_REDIRECT_URI',
  'RUN_AS'
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
  // Required in server mode since the default credential was removed: a
  // valid server configuration now includes an explicit admin password.
  process.env.ADMIN_PASSWORD_INITIAL = 'a-valid-initial-password'
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
    it('should require an explicit admin password in server mode', () => {
      delete process.env.ADMIN_PASSWORD_INITIAL

      // No default credential may be silently accepted: the deployment
      // must fail to start (v1.2.0 review, HIGH 2).
      expect(verifyEnvVariables()).toEqual(ReturnCode.InvalidEnv)
    })

    it('should allow no local admin when OIDC can bootstrap one', () => {
      delete process.env.ADMIN_PASSWORD_INITIAL
      process.env.AUTH_PROVIDERS = 'oidc'
      setValidOidcEnv()

      // With a provider that provisions accounts, the first user to sign in
      // becomes the administrator, so no local admin - and no credential
      // nobody can read - is required. ADMIN_PASSWORD_INITIAL is normalised
      // to '' so that seedDB seeds nothing.
      expect(verifyEnvVariables()).toEqual(ReturnCode.Success)
      expect(process.env.ADMIN_PASSWORD_INITIAL).toEqual('')
    })

    it('should still require an admin password when only LDAP is enabled', () => {
      delete process.env.ADMIN_PASSWORD_INITIAL
      process.env.AUTH_PROVIDERS = 'ldap'
      setValidLdapEnv()

      // LDAP authenticates against an account that must already exist - it
      // cannot provision one - so with no local admin nobody could ever sign
      // in. Fail closed.
      expect(verifyEnvVariables()).toEqual(ReturnCode.InvalidEnv)
    })

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

  describe('TRUST_PROXY validation', () => {
    it('should accept a hop count, a boolean, an address, and a list', () => {
      ;['1', 'true', 'false', '172.18.0.1', '172.18.0.0/16,10.0.0.1'].forEach(
        (value) => {
          process.env.TRUST_PROXY = value
          expect(verifyEnvVariables()).toEqual(ReturnCode.Success)
        }
      )
    })

    it('should reject a value Express cannot parse', () => {
      // Express throws on an unparseable value at startup, which is a confusing
      // way to learn about a typo - the shape is checked here instead.
      process.env.TRUST_PROXY = 'yes please'
      expect(verifyEnvVariables()).toEqual(ReturnCode.InvalidEnv)
    })

    it('should be optional', () => {
      delete process.env.TRUST_PROXY
      expect(verifyEnvVariables()).toEqual(ReturnCode.Success)
    })
  })

  describe('LOCAL_LOGIN_ENABLED validation', () => {
    it('should accept a boolean', () => {
      ;['true', 'false'].forEach((value) => {
        process.env.AUTH_PROVIDERS = 'oidc'
        setValidOidcEnv()
        process.env.LOCAL_LOGIN_ENABLED = value

        expect(verifyEnvVariables()).toEqual(ReturnCode.Success)
      })
    })

    it('should reject a value that is not a boolean', () => {
      process.env.LOCAL_LOGIN_ENABLED = 'no'

      expect(verifyEnvVariables()).toEqual(ReturnCode.InvalidEnv)
    })

    it('should reject switching the local login off with no provider configured', () => {
      delete process.env.AUTH_PROVIDERS
      process.env.LOCAL_LOGIN_ENABLED = 'false'

      // With the local path off and no provider to authenticate against, no
      // account could sign in - the deployment fails to start instead.
      expect(verifyEnvVariables()).toEqual(ReturnCode.InvalidEnv)
    })

    it('should be optional, and enabled by default', () => {
      delete process.env.LOCAL_LOGIN_ENABLED

      expect(verifyEnvVariables()).toEqual(ReturnCode.Success)
      expect(isLocalLoginEnabled()).toEqual(true)
    })

    it('should report the configured value', () => {
      process.env.AUTH_PROVIDERS = 'oidc'
      setValidOidcEnv()
      process.env.LOCAL_LOGIN_ENABLED = 'false'

      expect(isLocalLoginEnabled()).toEqual(false)
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

describe('verifyRunAs', () => {
  // The server executes uploaded code, so its identity is the privilege every
  // connected user gets - and in desktop mode there is no authentication at
  // all. The effective uid is injectable, so the root branch is reachable
  // without running the suite as root.
  const NON_ROOT_UID = 1000

  afterEach(() => {
    delete process.env.RUN_AS
  })

  it('accepts a non-root process with RUN_AS unset', () => {
    expect(verifyRunAs(NON_ROOT_UID)).toEqual([])
  })

  it('refuses to run as root when RUN_AS is unset', () => {
    const errors = verifyRunAs(0)

    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('running as root')
    expect(errors[0]).toContain('RUN_AS')
  })

  it('accepts root when RUN_AS=root names it deliberately', () => {
    process.env.RUN_AS = 'root'

    expect(verifyRunAs(0)).toEqual([])
  })

  it('accepts RUN_AS naming the account the process already runs as', () => {
    process.env.RUN_AS = userInfo().username

    expect(verifyRunAs(NON_ROOT_UID)).toEqual([])
  })

  it('accepts a numeric RUN_AS matching the uid', () => {
    process.env.RUN_AS = String(NON_ROOT_UID)

    expect(verifyRunAs(NON_ROOT_UID)).toEqual([])
  })

  it('rejects RUN_AS naming a different account', () => {
    process.env.RUN_AS = 'someone-else'

    const errors = verifyRunAs(NON_ROOT_UID)

    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain("RUN_AS 'someone-else'")
  })

  it('rejects RUN_AS=root when the process is not root', () => {
    process.env.RUN_AS = 'root'

    const errors = verifyRunAs(NON_ROOT_UID)

    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('start it as root')
  })

  it('treats an empty RUN_AS as unset', () => {
    process.env.RUN_AS = ''

    // An install that writes `RUN_AS=` into config.env gets the default, which
    // still refuses root - so this stays fail-closed.
    expect(verifyRunAs(NON_ROOT_UID)).toEqual([])

    const errors = verifyRunAs(0)

    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('running as root')
  })

  it('skips the uid comparison where there is no uid (Windows)', () => {
    expect(verifyRunAs(undefined)).toEqual([])

    process.env.RUN_AS = userInfo().username

    expect(verifyRunAs(undefined)).toEqual([])
  })

  it('surfaces through the startup env gate', () => {
    // verifyEnvVariables is the single gate app.ts acts on, so the RUN_AS
    // errors have to reach it. A mismatched RUN_AS is an error on any host,
    // root or not.
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    setValidServerEnv()
    process.env.RUN_AS = 'definitely-not-this-account'

    expect(verifyEnvVariables()).toEqual(ReturnCode.InvalidEnv)

    if (originalNodeEnv === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = originalNodeEnv
  })
})
