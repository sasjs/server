/**
 * The emulated estate, driven by a real client over a socket.
 *
 * Every other Viya spec in this package asserts what this server answers. This
 * one asserts that `@sasjs/adapter` can read those answers, which is a different
 * question: a body shaped like the capture still fails a client that follows a
 * link the body does not carry, and no handler-level spec can see that.
 *
 * It lives in this package because the client is a dependency here. An emulator
 * package has no adapter of its own, so a conformance run inside `@sasjs/api`
 * would run only on a machine where someone pointed an environment variable at a
 * checkout - the "passes only with local state" shape.
 *
 * The client under contract is `@sasjs/adapter` 6.x, the version the emulator's
 * surface was measured against (`spec/viya/adapter-paths.json` in `@sasjs/api`).
 * This package depends on that same version, so this run and the estate client
 * in `src/controllers/internal/viyaClient.ts` drive one copy of the adapter: a
 * change that fails the run is a change that fails the real client. One case
 * takes the client that module builds rather than constructing its own, so the
 * parameters the server passes - the server URL, the context name, the server
 * type - are under the run too; without it a change to them would break the
 * server with this run green.
 *
 * The CLI is the other caller, and it is driven as a process rather than through
 * the adapter API: `sasjs folder create` types the command a user types, and gets
 * its own argument parsing, config discovery and auth path. Its own literals are
 * measured in `@sasjs/api`'s scope check (`spec/viya/cli-paths.json`), so a path
 * only the CLI builds is declared there; this case is the other half - that the
 * declared surface is enough to run it.
 *
 * What this run cannot prove: execution. A job runs on this server's engine, and
 * a machine without SAS has none, so the submit-and-read-the-webout leg is gated
 * on `CONFORMANCE_EXECUTE=1` and is reported as SKIPPED when it is unset - never
 * as a pass, which is what a returning case would claim. Everything an
 * application does before its first service - sign in, find a context, open a
 * session, create a folder, upload a file, read it back - runs here with no
 * engine at all.
 */
import { spawn } from 'child_process'
import express, { Express } from 'express'
import { mkdir, mkdtemp, rm, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import type { Server } from 'http'
import { tmpdir } from 'os'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { SASViyaApiClient, SasjsRequestClient } from '@sasjs/adapter/node'

import { configureBodyParsers } from '../app-modules'
import {
  getViyaClient,
  resetViyaClient
} from '../controllers/internal/viyaClient'
import { ModeType, SECRETS } from '../utils'
import {
  PermissionController,
  PermissionSettingForRoute,
  PermissionType,
  PrincipalType,
  UserController
} from '../controllers/'

/**
 * Where the CLI's own entry point is.
 *
 * A process rather than an import: what a user runs is `sasjs <command>`, and an
 * in-process call would skip the argument parsing, the config discovery and the
 * auth path that a person meets - which are exactly the parts a test of the
 * emulator's usability has to cover.
 *
 * The CLI is installed rather than declared. It is a devDependency-shaped need
 * that the package's own lock does not carry: adding it re-resolves trees this
 * repository pins for other reasons (`@emnapi` under `@unrs/resolver-binding`),
 * and a lock file rewritten for one test would put every other install at the
 * mercy of whoever regenerated it. The job installs it into a prefix of its own
 * by exact version and names the entry point in `SASJS_CLI_ENTRY`; a run without
 * it fails here with the command to type rather than skipping - a skipped case
 * reads as a pass in a summary, and the point of this case is that it ran.
 */
const cliEntry = (): string => {
  // The job installs the CLI into a prefix of its own and names the entry point,
  // so this run never depends on what the repository's own manifest resolves
  if (process.env.SASJS_CLI_ENTRY) return process.env.SASJS_CLI_ENTRY

  try {
    return join(
      dirname(require.resolve('@sasjs/cli/package.json')),
      'build',
      'index.js'
    )
  } catch {
    throw new Error(
      'The conformance run needs the CLI as a process. Install it by exact ' +
        'version and point SASJS_CLI_ENTRY at it: `npm install --prefix ' +
        '/tmp/conformance-cli --ignore-scripts @sasjs/cli@8.0.5`.'
    )
  }
}

/**
 * Run the CLI with its own HOME.
 *
 * `HOME` is a temporary directory so the run reads no developer's `~/.sasjsrc`
 * and writes none: a target left in a real home directory changes what every
 * later command on that machine resolves. `NO_PROXY` is set for the same reason
 * a test should not inherit one - this box, and many build agents, route egress
 * through a proxy, and the estate under test is on loopback.
 */
const runCli = (args: string[], options: { cwd: string; home: string }) =>
  new Promise<{ code: number | null; output: string }>((resolve, reject) => {
    const child = spawn(process.execPath, [cliEntry(), ...args], {
      cwd: options.cwd,
      env: {
        ...process.env,
        HOME: options.home,
        USERPROFILE: options.home,
        NO_PROXY: '*',
        no_proxy: '*',
        NO_COLOR: '1'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let output = ''

    child.stdout.on('data', (chunk) => (output += String(chunk)))
    child.stderr.on('data', (chunk) => (output += String(chunk)))
    child.on('error', reject)
    child.on('close', (code) => resolve({ code, output }))
  })

/** The public client the CLI signs in with, and the account a caller uses. */
const clientId = 'sas.cli'
const user = {
  displayName: 'Viya Conformance',
  username: 'viyaconformance',
  password: 'conformancePassword',
  isAdmin: false,
  isActive: true
}

interface TokenPair {
  access_token: string
  refresh_token: string
  expires_in: number
  [key: string]: unknown
}

/**
 * The execution leg, declared rather than returned when this host has no engine.
 *
 * A returning `it` is a PASS to jest, so a machine without SAS would report the
 * leg as verified when it never ran - the silent zero this run exists to catch.
 * Skipped, the summary names the leg and says it did not run.
 */
const executionLeg = (name: string, fn: () => Promise<void>) =>
  process.env.CONFORMANCE_EXECUTE === '1' ? it(name, fn) : it.skip(name, fn)

describe('a Viya client against the emulated estate', () => {
  let server: Express
  let listener: Server
  let origin: string
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  /** The drive and log root this run creates, removed with the rest of the teardown. */
  let root: string
  let client: SASViyaApiClient
  let tokens: TokenPair

  const userController = new UserController()
  const permissionController = new PermissionController()

  /**
   * The globals this file installs, read before it installs them.
   *
   * `sasjsRoot`, `driveLoc`, `logsLoc` and `secrets` are process-wide and point
   * into the temp root the teardown deletes. `maxWorkers: 1` keeps a second
   * conformance file from running beside this one, but the test match is a glob:
   * without the restore, a file added next to this one starts against a deleted
   * root and this run's secrets.
   */
  const savedGlobals = {
    sasjsRoot: process.sasjsRoot,
    driveLoc: process.driveLoc,
    logsLoc: process.logsLoc,
    secrets: process.secrets,
    mode: process.env.MODE,
    emulateViya: process.env.EMULATE_VIYA
  }

  const restoreEnv = (key: string, value: string | undefined) => {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }

  /**
   * The password grant, posted as `sasjs auth login` posts it.
   *
   * The adapter has no method for this grant - the CLI does the sign-in itself -
   * so this is the one request in the file the client does not make. Everything
   * after it, including the refresh, goes through the adapter's own code.
   */
  const signIn = async (): Promise<TokenPair> => {
    const body = new URLSearchParams({
      grant_type: 'password',
      username: user.username,
      password: user.password
    })

    const answer = await fetch(`${origin}/SASLogon/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:`).toString('base64')}`
      },
      body
    })

    expect(answer.status).toBe(200)

    return (await answer.json()) as TokenPair
  }

  /** A read through the estate, for the cases the client has no method for. */
  const read = (path: string, accessToken = tokens.access_token) =>
    fetch(`${origin}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

  beforeAll(async () => {
    // what the server sets at boot, before `setupRoutes` reads them
    root = await mkdtemp(join(tmpdir(), 'viya-conformance-'))

    process.sasjsRoot = root
    process.driveLoc = join(root, 'drive')
    process.logsLoc = join(root, 'logs')
    process.env.MODE = ModeType.Server
    process.env.EMULATE_VIYA = 'true'

    // what `setProcessVariables` installs at boot: the token port mints a pair
    // the guard verifies with the same secret
    process.secrets = SECRETS

    mongoServer = await MongoMemoryServer.create()
    con = await mongoose.connect(mongoServer.getUri())

    const dbUser = await userController.createUser(user)

    // the routes the estate stands for, granted to this account: a job runs
    // code, and a file or folder route touches the drive
    for (const route of [
      '/SASjsApi/code/execute',
      '/SASjsApi/drive/file',
      '/SASjsApi/drive/folder'
    ]) {
      await permissionController.createPermission({
        path: route,
        type: PermissionType.route,
        setting: PermissionSettingForRoute.grant,
        principalType: PrincipalType.user,
        principalId: dbUser.uid
      })
    }

    server = express()

    // the parsers the server installs, from the server's own module: a harness
    // without them answers "a folder name is required" to a request that carries
    // a name
    configureBodyParsers(server)

    const { setupRoutes } = await import('../routes/setupRoutes')

    await setupRoutes(server)

    // a real socket, because the client is what is being tested: a supertest
    // request would skip the transport the adapter brings
    listener = server.listen(0)

    const address = listener.address()

    if (!address || typeof address === 'string')
      throw new Error('the conformance server did not bind a port')

    origin = `http://127.0.0.1:${address.port}`

    client = new SASViyaApiClient(
      origin,
      '',
      'SAS Job Execution compute context',
      new SasjsRequestClient(origin)
    )

    tokens = await signIn()
  })

  afterAll(async () => {
    // Guarded step by step: a boot that throws part way leaves some of these
    // unassigned, and a teardown that dereferences one of them throws a TypeError
    // in place of the real failure and leaves the rest undone - a mongod started
    // by `MongoMemoryServer.create()` would outlive the run. Each step is
    // attempted whether or not an earlier one failed, and the first real cause is
    // what the report shows.
    try {
      if (listener) await new Promise((resolve) => listener.close(resolve))
      if (con) {
        await con.connection.dropDatabase()
        await con.connection.close()
      }
      if (mongoServer) await mongoServer.stop()
      // the drive, the logs and the session folders this run wrote: a harness that
      // left one behind per run would fill the temporary directory it runs in
      if (root) await rm(root, { recursive: true, force: true })
    } catch (error) {
      // a failed teardown must not mask a failed run: this is reported, not thrown
      console.error('conformance teardown:', error)
    } finally {
      // the globals go back to what this file found, because they are process
      // wide and the root they point into has just been deleted. The cached
      // estate client goes with them, or the next file in this process would
      // read the wiring this run chose.
      resetViyaClient()

      process.sasjsRoot = savedGlobals.sasjsRoot
      process.driveLoc = savedGlobals.driveLoc
      process.logsLoc = savedGlobals.logsLoc
      process.secrets = savedGlobals.secrets

      restoreEnv('MODE', savedGlobals.mode)
      restoreEnv('EMULATE_VIYA', savedGlobals.emulateViya)
    }
  })

  it('refreshes the pair through the client, and refuses the token it replaced', async () => {
    const refreshed = await client.refreshTokens(
      clientId,
      '',
      tokens.refresh_token
    )

    expect(refreshed.access_token).toBeTruthy()
    expect(refreshed.refresh_token).toBeTruthy()
    expect(refreshed.access_token).not.toBe(tokens.access_token)

    // the refreshed pair is the one the estate accepts
    const answer = await read(
      '/identities/users/@currentUser',
      refreshed.access_token
    )
    expect(answer.status).toBe(200)

    // rotation is single use, and both halves of that are asserted: the client's
    // own verdict on the refusal, and the status and error the estate answers with.
    // `rejects.toBeTruthy()` would be satisfied by a 500 or a dropped socket, which
    // is not the same statement.
    const replaced = tokens

    await expect(
      client.refreshTokens(clientId, '', replaced.refresh_token)
    ).rejects.toMatchObject({ name: 'LoginRequiredError' })

    const replay = await fetch(`${origin}/SASLogon/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: replaced.refresh_token
      })
    })

    expect(replay.status).toBe(401)
    expect(await replay.json()).toMatchObject({ error: 'invalid_grant' })

    tokens = refreshed as unknown as TokenPair
  })

  it('answers the call every session begins with, and says it is emulated', async () => {
    const answer = await read('/identities/users/@currentUser')

    expect(answer.status).toBe(200)
    expect(answer.headers.get('x-sasjs-emulated')).toMatch(/^viya@/)

    const me = (await answer.json()) as { id: string; name: string }
    expect(me.id).toBeTruthy()
  })

  it('lists the compute contexts', async () => {
    const contexts = await client.getComputeContexts(tokens.access_token)

    expect(contexts.length).toBeGreaterThan(0)
    expect(contexts[0].name).toBeTruthy()
  })

  it('drives the estate through the client the server builds', async () => {
    // The estate client never constructs SASViyaApiClient: it asks this module
    // for the wrapper SASjs builds from VIYA_URL and VIYA_CONTEXT, then reads the
    // compute client off it (src/controllers/internal/viyaClient.ts). Every other
    // case here builds its own client, so a change to what the server passes -
    // the server URL, the context name, the server type, the options handed to
    // SASjs - would leave them all green and break the server. This case takes
    // that module's client instead and asks the estate a question needing no
    // engine, so it runs wherever the rest of this run does.
    const saved = {
      url: process.env.VIYA_URL,
      context: process.env.VIYA_CONTEXT
    }

    process.env.VIYA_URL = origin
    process.env.VIYA_CONTEXT = 'SAS Job Execution compute context'

    // the client is cached for the process, so this case builds a fresh one from
    // its own env rather than accepting whatever an earlier caller left behind
    resetViyaClient()

    try {
      const built = (getViyaClient() as any)
        .sasViyaApiClient as SASViyaApiClient

      expect(built).toBeInstanceOf(SASViyaApiClient)

      // the context the wrapper handed over is the one this module resolved, not
      // one the case chose: a change to getViyaContext() or to the config it
      // passes fails here
      expect((built as any).contextName).toBe(process.env.VIYA_CONTEXT)

      const contexts = await built.getComputeContexts(tokens.access_token)

      expect(contexts.length).toBeGreaterThan(0)
    } finally {
      if (saved.url === undefined) delete process.env.VIYA_URL
      else process.env.VIYA_URL = saved.url

      if (saved.context === undefined) delete process.env.VIYA_CONTEXT
      else process.env.VIYA_CONTEXT = saved.context

      // and the client built from this case's env goes with the env: it is
      // cached for the process, so leaving it would hand this run's socket to
      // whatever reads the estate client next
      resetViyaClient()
    }
  })

  it('opens two sessions the client accepts as live', async () => {
    // the client ages a session from `creationTimeStamp` against
    // `sessionInactiveTimeout`, so a session stamped in the past is discarded on
    // the way in and this call is what notices
    const first = await client.createSession(
      'SAS Job Execution compute context',
      tokens.access_token
    )
    const second = await client.createSession(
      'SAS Job Execution compute context',
      tokens.access_token
    )

    expect(first.id).toBeTruthy()
    expect(second.id).toBeTruthy()
    expect(second.id).not.toBe(first.id)
  })

  it('creates a folder at the root, and a child inside it', async () => {
    const folder = await client.createFolder(
      'conformanceRoot',
      '/',
      undefined,
      tokens.access_token
    )

    expect(folder.id).toBeTruthy()

    const child = await client.createFolder(
      'child',
      '/conformanceRoot',
      undefined,
      tokens.access_token
    )

    expect(child.id).toBeTruthy()

    // reading it back is the id round trip: the client holds the id and asks the
    // estate for the folder again
    const fetched = await client.getFolder(
      '/conformanceRoot/child',
      tokens.access_token
    )
    expect(fetched).toBeTruthy()
  })

  it('uploads a file, reads its content, and replaces the content', async () => {
    const contents = 'the first version'

    const file = await client.createFile(
      'conformance.txt',
      Buffer.from(contents),
      '/conformanceRoot',
      undefined,
      tokens.access_token
    )

    expect(file.id).toBeTruthy()

    expect(
      await client.getFileContent(
        '/conformanceRoot',
        'conformance.txt',
        tokens.access_token
      )
    ).toBe(contents)

    const replacement = 'the second version'

    await client.updateFileContent(
      '/conformanceRoot',
      'conformance.txt',
      replacement,
      tokens.access_token
    )

    expect(
      await client.getFileContent(
        '/conformanceRoot',
        'conformance.txt',
        tokens.access_token
      )
    ).toBe(replacement)
  })

  it('moves the folder into the recycle bin, and cannot read it after', async () => {
    // `deleteFolder` is a PATCH into `@myRecycleBin`, and the client reads that
    // folder on the way - an emulator answering DELETE would answer a call no
    // client makes
    await client.deleteFolder('/conformanceRoot', tokens.access_token)

    // the client says `NotFoundError` with the address it asked for, and the estate
    // says 404 with its own message: either half alone passes on a 500
    await expect(
      client.getFolder('/conformanceRoot', tokens.access_token)
    ).rejects.toMatchObject({
      name: 'NotFoundError',
      url: '/folders/folders/@item?path=/conformanceRoot'
    })

    const answered = await read('/folders/folders/@item?path=/conformanceRoot')

    expect(answered.status).toBe(404)
    expect(await answered.json()).toMatchObject({
      message: "Folder doesn't exist."
    })
  })

  executionLeg('runs a service and reads its webout', async () => {
    const linesOfCode = [
      'data _null_;',
      '  file _webout;',
      "  put 'conformance webout';",
      'run;'
    ]

    const result = await client.executeScript(
      'conformance/job',
      linesOfCode,
      'SAS Job Execution compute context',
      undefined,
      null,
      true,
      true,
      true
    )

    expect(String(result.result ?? '')).toContain('conformance webout')
  })

  /**
   * The CLI, as a process, against the same estate.
   *
   * Every case above drives `@sasjs/adapter` from this process. A deployment is
   * not driven that way: `sasjs` is, and the emulator exists so that a project
   * targeting a Viya estate can be deployed and demonstrated without one. That
   * claim is only worth something if the command a person types reaches this
   * estate, so this case types it - the CLI's own entry point, its own argument
   * parsing, its own config discovery, its own auth path, and the adapter's
   * requests underneath.
   *
   * The target carries the pair this run already minted, because the password
   * grant is a person typing a password and there is no way to ask one here: what
   * is under test is the deployment surface after sign-in, not the prompt.
   */
  it('is driven by the CLI: a folder created with `sasjs` exists on the estate', async () => {
    const home = await mkdtemp(join(tmpdir(), 'viya-cli-home-'))
    const project = await mkdtemp(join(tmpdir(), 'viya-cli-project-'))
    // the estate the run booted has an empty drive, and a deployment's appLoc
    // already exists on a real one: creating it here keeps the case about what
    // the CLI does - create the deployment folder - rather than about the drive
    // happening to have a /Public
    const appLoc = '/cli-conformance'

    await client.createFolder(
      'cli-conformance',
      '/',
      undefined,
      tokens.access_token
    )

    try {
      await mkdir(join(project, 'sasjs'), { recursive: true })

      await writeFile(
        join(project, 'sasjs', 'sasjsconfig.json'),
        JSON.stringify(
          {
            name: 'conformance',
            defaultTarget: 'viya',
            targets: [
              {
                name: 'viya',
                serverType: 'SASVIYA',
                serverUrl: origin,
                appLoc,
                authConfig: {
                  access_token: tokens.access_token,
                  refresh_token: tokens.refresh_token,
                  client: clientId,
                  secret: ''
                }
              }
            ]
          },
          null,
          2
        ),
        'utf8'
      )

      const { code, output } = await runCli(
        ['folder', 'create', `${appLoc}/from-the-cli`, '-t', 'viya'],
        { cwd: project, home }
      )

      // the CLI's own exit code, with its output in the failure: a run that fails
      // without saying what the CLI printed leaves the next reader guessing
      expect({ code, output: code === 0 ? '' : output }).toEqual({
        code: 0,
        output: ''
      })

      // and the estate agrees: the folder is read back through the client, so a
      // CLI that printed "created" without creating anything fails here
      const created = await client.getFolder(
        `${appLoc}/from-the-cli`,
        tokens.access_token
      )

      expect(created).toBeTruthy()
    } finally {
      await rm(home, { recursive: true, force: true })
      await rm(project, { recursive: true, force: true })
    }
  })
})
