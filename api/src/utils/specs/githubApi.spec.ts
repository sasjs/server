import { githubApiHeaders } from '../githubApi'

const managedEnvVars = ['GITHUB_TOKEN', 'GH_TOKEN']

describe('githubApiHeaders', () => {
  let originalEnv: { [key: string]: string | undefined }

  beforeAll(() => {
    originalEnv = { ...process.env }
  })

  beforeEach(() => {
    managedEnvVars.forEach((name) => delete process.env[name])
  })

  afterAll(() => {
    process.env = originalEnv as { [key: string]: string }
  })

  it('sends no Authorization header when no token is configured', () => {
    expect(githubApiHeaders()).toEqual({})
  })

  it('sends GITHUB_TOKEN as a bearer token', () => {
    process.env.GITHUB_TOKEN = 'ghs_example'

    expect(githubApiHeaders()).toEqual({ Authorization: 'Bearer ghs_example' })
  })

  it('falls back to GH_TOKEN', () => {
    process.env.GH_TOKEN = 'gho_example'

    expect(githubApiHeaders()).toEqual({ Authorization: 'Bearer gho_example' })
  })

  it('prefers GITHUB_TOKEN when both are set', () => {
    process.env.GITHUB_TOKEN = 'ghs_example'
    process.env.GH_TOKEN = 'gho_example'

    expect(githubApiHeaders()).toEqual({ Authorization: 'Bearer ghs_example' })
  })
})
