/**
 * The retry that waits out a registry publish window, tested.
 *
 * The failure it exists for - `ETARGET: No matching version found` a minute
 * after a release - only appears in a deploy, so the classification is asserted
 * here instead: a command that fails with that message is retried, and any other
 * failure is not.
 */
import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { createServer } from 'node:http'
import {
  existsSync,
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  buildIdentity,
  demoLoginMeta,
  demoLogins,
  readDemoLogins,
  run,
  runWhenTheRegistryIsReady,
  stampedWorker
} from './lib.mjs'

test('mock web build uses the same selected core tree as the drive', async (t) => {
  for (const cached of [true, false])
    await t.test(cached ? 'cached core' : 'fresh core', async () => {
      const root = mkdtempSync(
        path.join(os.tmpdir(), 'mock core $(exit 37) build-')
      )
      let registry
      try {
        mkdirSync(path.join(root, 'mock'))
        cpSync(
          new URL('./build.mjs', import.meta.url),
          path.join(root, 'mock', 'build.mjs')
        )
        for (const name of ['lib.mjs', 'driveSeed.mjs', 'apps.mjs'])
          cpSync(
            new URL(`./${name}`, import.meta.url),
            path.join(root, 'mock', name)
          )
        const core = path.join(root, 'sasjsbuild', 'macro-core')
        const probe = path.join(root, 'probe.json')
        const driveProbe = path.join(root, 'drive-probe.json')
        mkdirSync(core, { recursive: true })
        mkdirSync(path.join(root, 'web'))
        writeFileSync(
          path.join(core, 'package.json'),
          JSON.stringify({ name: '@sasjs/core', version: '99.0.0' })
        )
        writeFileSync(
          path.join(root, 'sasjsbuild', 'macro-core.txt'),
          '@sasjs/core 99.0.0\n'
        )
        if (!cached) {
          const staging = path.join(root, 'staging', 'package')
          mkdirSync(staging, { recursive: true })
          writeFileSync(
            path.join(staging, 'package.json'),
            JSON.stringify({ name: '@sasjs/core', version: '99.0.0' })
          )
          execFileSync('tar', [
            'czf',
            path.join(root, 'fixture.tgz'),
            '-C',
            path.join(root, 'staging'),
            'package'
          ])
          rmSync(path.join(root, 'sasjsbuild'), { recursive: true })
          // Exercise the actual npm pack against a local registry, not a stubbed
          // command or the public network. The path also contains shell syntax.
          const requests = []
          registry = createServer((req, res) => {
            requests.push(req.url)
            if (req.url === '/fixture.tgz') {
              res.writeHead(200, { 'content-type': 'application/octet-stream' })
              res.end(readFileSync(path.join(root, 'fixture.tgz')))
            } else if (req.url.toLowerCase() === '/@sasjs%2fcore') {
              res.writeHead(200, { 'content-type': 'application/json' })
              res.end(
                JSON.stringify({
                  name: '@sasjs/core',
                  'dist-tags': { latest: '99.0.0' },
                  versions: {
                    '99.0.0': {
                      name: '@sasjs/core',
                      version: '99.0.0',
                      dist: {
                        tarball: `http://127.0.0.1:${registry.address().port}/fixture.tgz`
                      }
                    }
                  }
                })
              )
            } else {
              res.writeHead(404)
              res.end()
            }
          })
          await new Promise((resolve) =>
            registry.listen(0, '127.0.0.1', resolve)
          )
          registry.requests = requests
        }
        writeFileSync(path.join(root, 'mock', 'drive.json'), '{}')
        writeFileSync(
          path.join(root, 'mock', 'apps.mjs'),
          `export const PUBLISHED_APPS=[]; export const resolveRelease=()=>{}; export const releaseUrl=()=>{}; export const fetchPack=()=>{}; export const withPublishedApps=(s)=>s`
        )
        writeFileSync(
          path.join(root, 'mock', 'driveSeed.mjs'),
          `import fs from 'node:fs'; export const withServerSeededFiles=(s)=>s; export const withCodeSources=(s, sources)=>{fs.writeFileSync(process.env.DRIVE_PROBE,JSON.stringify({root:sources[0].root,version:JSON.parse(fs.readFileSync(sources[0].root+'/package.json')).version}));throw Error('end of test')}`
        )
        mkdirSync(path.join(root, 'api', 'src', 'utils'), { recursive: true })
        writeFileSync(
          path.join(
            root,
            'api',
            'src',
            'utils',
            'defaultLintConfiguration.json'
          ),
          '{}'
        )
        const packages = path.join(root, 'sasjsbuild', 'sas-packages')
        mkdirSync(path.join(packages, 'SPF'), { recursive: true })
        writeFileSync(
          path.join(root, 'sasjsbuild', 'sas-packages.txt'),
          'fixture'
        )
        const preload = path.join(root, 'commands.cjs')
        writeFileSync(
          preload,
          `// Intercept only the build's external commands; keep its control flow and tar extraction real.
const child = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const realExecSync = child.execSync
child.execSync = (command, options) => {
  const root = process.env.TEST_ROOT
  if (command.startsWith('npx ') && command.endsWith('--version')) return 'v1.2.3\\n'
  if (command.startsWith('npx ') && command.includes('compile')) {
    if (process.env.TEST_CACHED === 'false') fs.rmSync(path.join(root, 'sasjsbuild'), { recursive: true, force: true })
    fs.mkdirSync(path.join(root, 'sasjsbuild', 'sas-packages', 'SPF'), { recursive: true })
    fs.writeFileSync(path.join(root, 'sasjsbuild', 'sas-packages.txt'), 'fixture')
    return ''
  }
  if (command.startsWith('npm pack ')) return realExecSync(command, options)
  if (command === 'npm run docs:build') return ''
  if (command === 'npm run build' && options.cwd === process.env.TEST_WEB) {
    const core = process.env.SASJS_CORE_ROOT
    fs.writeFileSync(process.env.TEST_PROBE, JSON.stringify({root: core, version: JSON.parse(fs.readFileSync(path.join(core, 'package.json'))).version}))
    return ''
  }
  throw new Error('Unexpected external command: ' + command)
}
require('node:module').syncBuiltinESMExports()
`
        )
        const result = await new Promise((resolve, reject) => {
          const child = spawn(
            process.execPath,
            [path.join(root, 'mock', 'build.mjs')],
            {
              env: {
                ...process.env,
                NODE_OPTIONS: `--require=${JSON.stringify(preload)}`,
                npm_config_registry: registry
                  ? `http://127.0.0.1:${registry.address().port}/`
                  : '',
                npm_config_cache: path.join(root, 'npm-cache'),
                SASJS_CORE_ROOT: '/wrong/core',
                TEST_ROOT: root,
                TEST_CACHED: String(cached),
                TEST_WEB: path.join(root, 'web'),
                TEST_PROBE: probe,
                DRIVE_PROBE: driveProbe
              }
            }
          )
          let stdout = ''
          let stderr = ''
          child.stdout.on('data', (data) => {
            stdout += data
          })
          child.stderr.on('data', (data) => {
            stderr += data
          })
          child.on('error', reject)
          child.on('close', (status) => resolve({ status, stdout, stderr }))
        })
        assert.notEqual(result.status, 0, 'test stops at drive seeding')
        assert.match(
          result.stderr,
          /end of test/,
          result.stdout + result.stderr
        )
        if (!cached) {
          assert.ok(
            registry.requests.includes('/fixture.tgz'),
            'npm fetched the fixture tarball'
          )
          assert.equal(
            readFileSync(
              path.join(root, 'sasjsbuild', 'macro-core.txt'),
              'utf8'
            ),
            '@sasjs/core 99.0.0 (npm latest at build time)\n'
          )
        }
        assert.ok(existsSync(probe), result.stdout + result.stderr)
        const used = JSON.parse(readFileSync(probe, 'utf8'))
        assert.equal(used.root, core)
        assert.equal(used.version, '99.0.0')
        assert.ok(existsSync(driveProbe), result.stdout + result.stderr)
        assert.deepEqual(JSON.parse(readFileSync(driveProbe, 'utf8')), used)
      } finally {
        if (registry) await new Promise((resolve) => registry.close(resolve))
        rmSync(root, { recursive: true, force: true })
      }
    })
})

/**
 * A command that fails `failures` times with `message`, then succeeds - and
 * records how many times it ran, so a test can count the attempts.
 *
 * The script goes to a FILE and is run with `node <file>`: a script carried in
 * `-e` loses its newlines to shell quoting, and the failure then looks like a
 * syntax error rather than the registry message under test.
 */
const commandFailing = (counterFile, failures, message) => {
  const scriptFile = `${counterFile}.cjs`

  writeFileSync(
    scriptFile,
    [
      "const fs = require('fs')",
      `const file = ${JSON.stringify(counterFile)}`,
      'const seen = fs.existsSync(file) ? Number(fs.readFileSync(file)) : 0',
      'fs.writeFileSync(file, String(seen + 1))',
      `if (seen < ${failures}) {`,
      `  console.error(${JSON.stringify(message)})`,
      '  process.exit(1)',
      '}',
      "console.log('done')"
    ].join('\n')
  )

  return `${JSON.stringify(process.execPath)} ${JSON.stringify(scriptFile)}`
}

const counterFor = () => {
  const file = path.join(
    os.tmpdir(),
    `mock-build-retry-${process.pid}-${Math.random().toString(16).slice(2)}.txt`
  )

  rmSync(file, { force: true })

  return {
    file,
    attempts: () => (existsSync(file) ? Number(readFileSync(file, 'utf8')) : 0),
    clean: () => {
      rmSync(file, { force: true })
      rmSync(`${file}.cjs`, { force: true })
    }
  }
}

test('retries a registry that has not caught up, then succeeds', () => {
  const counter = counterFor()

  try {
    const attempts = runWhenTheRegistryIsReady(
      commandFailing(
        counter.file,
        1,
        'npm error code ETARGET\nnpm error notarget No matching version found'
      ),
      { pause: 10 }
    )

    assert.equal(attempts, 2)
    assert.equal(counter.attempts(), 2)
  } finally {
    counter.clean()
  }
})

test('throws at once on a failure that is not the registry', () => {
  const counter = counterFor()

  try {
    assert.throws(
      () =>
        runWhenTheRegistryIsReady(
          commandFailing(
            counter.file,
            5,
            'npm error 404 Not Found - GET webpack'
          ),
          { pause: 10 }
        ),
      /404 Not Found/
    )

    // one attempt: a broken build is not retried
    assert.equal(counter.attempts(), 1)
  } finally {
    counter.clean()
  }
})

test('gives up after the attempts it was given', () => {
  const counter = counterFor()

  try {
    assert.throws(
      () =>
        runWhenTheRegistryIsReady(
          commandFailing(counter.file, 9, 'npm error code ETARGET'),
          { attempts: 3, pause: 10 }
        ),
      /ETARGET/
    )

    assert.equal(counter.attempts(), 3)
  } finally {
    counter.clean()
  }
})

test('carries a failing command s output, which is what makes the retry possible', () => {
  const counter = counterFor()

  try {
    let said = ''

    try {
      run(commandFailing(counter.file, 1, 'npm error code ETARGET'), undefined)
    } catch (error) {
      said = `${error?.stdout ?? ''}${error?.stderr ?? ''}`
    }

    // with inherited stdio this is empty, and the retry above could never fire
    assert.match(said, /ETARGET/)
  } finally {
    counter.clean()
  }
})

/**
 * The demo's sign-in accounts, from the identity fixture the host ships.
 *
 * The failure this guards against is a login screen that advertises an account
 * the host refuses: a restated list drifts from the fixture, and the demo then
 * blames the visitor for a password printed on the page.
 */
test('lists the accounts the host would accept, and only those', () => {
  const identity = {
    format: 1,
    users: [
      {
        uid: 'user-admin',
        username: 'sasjsadmin',
        password: 'Orion123',
        isAdmin: true,
        isActive: true
      },
      {
        uid: 'user-restricted',
        username: 'sasjsuser',
        password: 'Orion123',
        isAdmin: false,
        isActive: true
      },
      // inactive: the host refuses it however right the password is
      {
        uid: 'user-off',
        username: 'retired',
        password: 'Orion123',
        isActive: false
      },
      // no password: an SSO account cannot use this form
      { uid: 'user-sso', username: 'directory-only', isActive: true },
      // malformed entries are dropped rather than thrown over
      null,
      { username: '' }
    ]
  }

  assert.deepEqual(demoLogins(identity), [
    { username: 'sasjsadmin', password: 'Orion123', admin: true },
    { username: 'sasjsuser', password: 'Orion123', admin: false }
  ])

  // nothing to list is not a failure: a host with no fixture shows no block
  assert.deepEqual(demoLogins({}), [])
  assert.deepEqual(demoLogins(undefined), [])
})

test('the meta is inert markup, and carries quotes as entities', () => {
  const tag = demoLoginMeta([
    { username: 'sasjsadmin', password: 'a"b<c&d', admin: true }
  ])

  assert.match(tag, /^<meta name="sasjs-demo-login" content="/)
  // a raw quote would end the attribute and hand the rest of the JSON to the page
  assert.equal(tag.includes('a"b'), false)
  assert.match(tag, /&quot;/)

  // what the page reads back is the JSON it was given
  const content = tag.match(/content="([^"]*)"/)[1]
  const decoded = content
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

  assert.deepEqual(JSON.parse(decoded), [
    { username: 'sasjsadmin', password: 'a"b<c&d', admin: true }
  ])

  // no accounts, no tag - the interface's switch is the tag's presence
  assert.equal(demoLoginMeta([]), '')
})

/**
 * A build with no identity fixture must fail, not publish a site whose login
 * screen offers no way in.
 *
 * The fixture is written by the pinned CLI, so its absence means that CLI stopped
 * writing one - the same class as a missing API console, which this build already
 * refuses to publish.
 */
test('refuses to build without the identity fixture, and reads it when it is there', () => {
  const folder = path.join(os.tmpdir(), `mock-identity-${process.pid}`)
  const fixture = path.join(folder, 'identity.json')

  mkdirSync(folder, { recursive: true })

  try {
    assert.throws(
      () => readDemoLogins(fixture, '8.0.4'),
      /no identity fixture.*8\.0\.4/s
    )

    writeFileSync(
      fixture,
      JSON.stringify({
        users: [
          { username: 'sasjsadmin', password: 'Orion123', isAdmin: true },
          { username: 'sasjsuser', password: 'Orion123', isAdmin: false }
        ]
      })
    )

    assert.deepEqual(readDemoLogins(fixture, '8.0.4'), [
      { username: 'sasjsadmin', password: 'Orion123', admin: true },
      { username: 'sasjsuser', password: 'Orion123', admin: false }
    ])
  } finally {
    rmSync(folder, { recursive: true, force: true })
  }
})

/**
 * The release the site reports comes from the checkout, so a tag reaches the
 * published page without a commit here.
 *
 * Asserted against a real repository rather than a stubbed runner: the failure
 * this guards is a `git describe` that answers something unexpected - a shallow
 * clone with no tags names the commit, not the release - and only git can say
 * what it answers.
 */
test('names the release the checkout is at, and falls back when there is no tag', () => {
  const folder = path.join(os.tmpdir(), `mock-identity-tag-${process.pid}`)
  const git = (command) =>
    execFileSync('git', command.split(' '), { cwd: folder, stdio: 'ignore' })

  mkdirSync(folder, { recursive: true })

  try {
    writeFileSync(path.join(folder, 'README.md'), 'a site\n')

    git('init -q')
    git(
      '-c user.email=sasjs@4gl.io -c user.name=sasjs commit -q --allow-empty -m one'
    )
    git('tag v1.2.3')

    const tagged = buildIdentity({ cwd: folder, env: {} })

    assert.equal(tagged.version, 'v1.2.3')
    assert.equal(tagged.gitHash.length, 7)
    assert.equal(tagged.display, `v1.2.3 (${tagged.gitHash})`)

    // a commit after the tag is named for both: the release it follows and the
    // commit that is actually published
    git(
      '-c user.email=sasjs@4gl.io -c user.name=sasjs commit -q --allow-empty -m two'
    )
    assert.match(
      buildIdentity({ cwd: folder, env: {} }).version,
      /^v1\.2\.3-1-g/
    )

    // what the release workflow passes, because it cuts the tag before building
    assert.deepEqual(
      buildIdentity({
        cwd: folder,
        env: {
          SASJS_SERVER_VERSION: 'v9.9.9',
          SASJS_SERVER_GIT_HASH: 'abcdef1234567890'
        }
      }),
      { version: 'v9.9.9', gitHash: 'abcdef1', display: 'v9.9.9 (abcdef1)' }
    )

    // not a checkout at all: a version that is obviously not a release beats a
    // build that cannot run. Outside the repository above, or git would answer
    // for its parent.
    const plain = path.join(os.tmpdir(), `mock-no-checkout-${process.pid}`)
    mkdirSync(plain, { recursive: true })

    assert.deepEqual(buildIdentity({ cwd: plain, env: {} }), {
      version: 'dev',
      gitHash: 'unknown',
      display: 'dev (unknown)'
    })

    rmSync(plain, { recursive: true, force: true })
  } finally {
    rmSync(folder, { recursive: true, force: true })
  }
})

/**
 * The worker is the CLI's file, so both places the release is written are
 * asserted present: a CLI release that moves one would otherwise publish a site
 * answering `dev` with a green pipeline.
 */
test('writes the release into the worker, and refuses a worker that has moved', () => {
  const worker = [
    "    build: { version: 'dev', gitHash: 'unknown', buildDate: null },",
    'const SERVICES = {',
    '  info: API.createInfoService(Object.assign({}, API.BROWSER_INFO, { runTimes }))',
    '}'
  ].join('\n')

  const stamped = stampedWorker(
    worker,
    {
      version: 'v8.7.0',
      gitHash: '60015df',
      display: 'v8.7.0 (60015df)',
      buildDate: '2026-11-21T09:30:00.000Z'
    },
    { cliVersion: '8.0.4' }
  )

  assert.match(
    stamped,
    /build: \{ version: "v8\.7\.0", gitHash: "60015df", buildDate: "2026-11-21T09:30:00\.000Z" \}/
  )
  // the property has to be set above the copy the service takes
  assert.ok(
    stamped.indexOf('API.BROWSER_INFO.version = "v8.7.0 (60015df)"') <
      stamped.indexOf('const SERVICES = {')
  )
  // nothing else about the worker moved
  assert.match(stamped, /API\.createInfoService\(Object\.assign/)

  assert.throws(
    () => stampedWorker('const SERVICES = {', {}, { cliVersion: '8.0.4' }),
    /does not carry .*build: \{ version: 'dev'.*8\.0\.4/s
  )
})
