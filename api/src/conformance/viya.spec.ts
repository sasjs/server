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
 * This package's own dependency on 4.19.1 is its client for a real estate
 * (`src/controllers/internal/viyaClient.ts`), which is a separate question and
 * moves on its own schedule, so 6.x arrives under an alias.
 *
 * What this run cannot prove: execution. A job runs on this server's engine, and
 * a machine without SAS has none, so the submit-and-read-the-webout leg is gated
 * on `CONFORMANCE_EXECUTE=1` and reports that it did not run rather than passing
 * quietly. Everything an application does before its first service - sign in,
 * find a context, open a session, create a folder, upload a file, read it back -
 * runs here with no engine at all.
 */
import express, { Express } from 'express'
import { mkdtemp } from 'fs/promises'
import type { Server } from 'http'
import { tmpdir } from 'os'
import { join } from 'path'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { SASViyaApiClient, SasjsRequestClient } from '@sasjs/adapter-v6/node'

import { configureBodyParsers } from '../app-modules'
import { ModeType, SECRETS } from '../utils'
import {
  PermissionController,
  PermissionSettingForRoute,
  PermissionType,
  PrincipalType,
  UserController
} from '../controllers/'

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

describe('a Viya client against the emulated estate', () => {
  let server: Express
  let listener: Server
  let origin: string
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  let client: SASViyaApiClient
  let tokens: TokenPair

  const userController = new UserController()
  const permissionController = new PermissionController()

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
    const root = await mkdtemp(join(tmpdir(), 'viya-conformance-'))

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
    await new Promise((resolve) => listener.close(resolve))
    await con.connection.dropDatabase()
    await con.connection.close()
    await mongoServer.stop()
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

    // rotation is single use, which is what a caller replaying a token on a real
    // estate is told
    await expect(
      client.refreshTokens(clientId, '', tokens.refresh_token)
    ).rejects.toBeTruthy()

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

    await expect(
      client.getFolder('/conformanceRoot', tokens.access_token)
    ).rejects.toBeTruthy()
  })

  it('runs a service and reads its webout, when this host has an engine', async () => {
    if (process.env.CONFORMANCE_EXECUTE !== '1') {
      // said out loud rather than skipped in silence: the leg exists, and the
      // machine it did not run on is the reason
      console.log(
        'conformance: execution not run - set CONFORMANCE_EXECUTE=1 on a host with a SAS engine'
      )

      return
    }

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
})
