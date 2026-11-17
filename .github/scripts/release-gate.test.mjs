// Tests the release gate on the cases it exists for, rather than only on the
// state the repository happens to be in.
//
// build.yml runs `node --test .github/scripts/release-gate.test.mjs` in its
// `lint` job on every pull request, because the script itself is only executed
// by a push to main and a guard nothing exercises can break with every check
// green.
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const script = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'release-gate.mjs'
)

const RELEASERC = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    [
      '@semantic-release/github',
      {
        assets: [
          { path: './executables/linux.zip', label: 'Linux' },
          { path: './executables/macos.zip', label: 'Macos' },
          { path: './executables/windows.zip', label: 'Windows' },
          { path: './executables/SHA256SUMS', label: 'Checksums' }
        ]
      }
    ]
  ]
}

const ASSETS = ['linux.zip', 'macos.zip', 'windows.zip', 'SHA256SUMS']

const checkout = (overrides = {}) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'release-gate-'))
  fs.writeFileSync(
    path.join(root, '.releaserc'),
    JSON.stringify(overrides.releaserc ?? RELEASERC)
  )
  fs.mkdirSync(path.join(root, 'executables'))
  return root
}

const populate = (root, sizes = {}) => {
  for (const name of ASSETS) {
    const size = sizes[name] ?? 10
    fs.writeFileSync(path.join(root, 'executables', name), 'x'.repeat(size))
  }
}

const run = (args, { cwd, input = '', env = {} } = {}) =>
  new Promise((resolve) => {
    const child = execFile(
      process.execPath,
      [script, ...args],
      { cwd, env: { ...process.env, ...env } },
      (error, stdout, stderr) => {
        resolve({ code: error ? error.code ?? 1 : 0, stdout, stderr })
      }
    )
    child.stdin.end(input)
  })

const scopeRaw = async (input) => {
  const root = checkout()
  const output = path.join(root, 'github-output')
  fs.writeFileSync(output, '')
  const result = await run(['scope'], {
    cwd: root,
    input,
    env: { GITHUB_OUTPUT: output }
  })

  return {
    ...result,
    outputs: Object.fromEntries(
      fs
        .readFileSync(output, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => line.split('='))
    )
  }
}

const scope = (files) => scopeRaw(files.join('\n'))

test('a documentation-only merge is not releasable', async () => {
  // b75e2b6b is the merge that released v7.24.3: one file, docs/hooks/html_fixes.py,
  // and the release it cut carried no assets.
  const result = await scope(['docs/hooks/html_fixes.py'])

  assert.equal(result.code, 0)
  assert.equal(result.outputs.releasable, 'false')
  assert.match(result.stdout, /only documentation changed/)
})

test('a code change is releasable', async () => {
  const result = await scope(['api/src/controllers/web.ts'])

  assert.equal(result.outputs.releasable, 'true')
})

test('a merge touching docs and code is releasable', async () => {
  const result = await scope([
    'docs/pages/release.md',
    'web/src/app/app.component.ts'
  ])

  assert.equal(result.outputs.releasable, 'true')
})

test('a file beside docs is not documentation', async () => {
  // `docsomething/x.md` is not under docs/, so it releases. Anchoring on the
  // prefix rather than a substring is what makes that true.
  const result = await scope(['docsomething/x.md'])

  assert.equal(result.outputs.releasable, 'true')
})

test('a quoted path git emits for a non-ASCII name is still documentation', async () => {
  // Without -z, git wraps such a name in quotes and C-escapes its bytes, so a
  // plain prefix test read it as code and would have released a docs-only merge.
  const result = await scopeRaw('"docs/caf\\303\\251.md"')

  assert.equal(result.outputs.releasable, 'false')
  assert.match(result.stdout, /only documentation changed/)
})

test('a quoted non-ASCII name outside docs still releases', async () => {
  const result = await scopeRaw('"web/src/caf\\303\\251.ts"')

  assert.equal(result.outputs.releasable, 'true')
})

test('-z input is split on NUL, and needs no unquoting', async () => {
  const docsOnly = await scopeRaw('docs/caf\u00e9.md\0')
  assert.equal(docsOnly.outputs.releasable, 'false')

  const mixed = await scopeRaw('docs/caf\u00e9.md\0api/src/server.ts\0')
  assert.equal(mixed.outputs.releasable, 'true')
})

test('an empty change list releases nothing', async () => {
  const result = await scope([])

  assert.equal(result.outputs.releasable, 'false')
  assert.match(result.stdout, /no files changed/)
})

test('the decision is readable without a GitHub output file', async () => {
  const root = checkout()
  const result = await run(['scope'], {
    cwd: root,
    input: 'api/src/server.ts',
    env: { GITHUB_OUTPUT: '' }
  })

  assert.match(result.stdout, /^releasable=true$/m)
  assert.match(result.stdout, /so this push releases/)
})

test('a complete set of assets passes', async () => {
  const root = checkout()
  populate(root)
  const result = await run(['assets'], { cwd: root })

  assert.equal(result.code, 0)
  assert.match(result.stdout, /SHA256SUMS is 10 bytes/)
})

test('a missing asset fails and names it', async () => {
  const root = checkout()
  populate(root)
  fs.rmSync(path.join(root, 'executables', 'windows.zip'))
  const result = await run(['assets'], { cwd: root })

  assert.equal(result.code, 1)
  assert.match(result.stderr, /windows\.zip \(absent\)/)
  assert.doesNotMatch(result.stderr, /linux\.zip/)
})

test('an empty asset fails, because a truncated zip ships nothing', async () => {
  const root = checkout()
  populate(root, { 'linux.zip': 0 })
  const result = await run(['assets'], { cwd: root })

  assert.equal(result.code, 1)
  assert.match(result.stderr, /linux\.zip \(empty\)/)
})

test('a checkout with no executables at all fails', async () => {
  // The v7.24.3 shape: the build steps were skipped, so the folder is empty.
  const root = checkout()
  const result = await run(['assets'], { cwd: root })

  assert.equal(result.code, 1)
  for (const name of ASSETS) assert.match(result.stderr, new RegExp(name))
})

test('assets are read from .releaserc rather than a second list', async () => {
  const root = checkout({
    releaserc: {
      plugins: [
        [
          '@semantic-release/github',
          { assets: [{ path: './executables/only.zip' }] }
        ]
      ]
    }
  })
  fs.writeFileSync(path.join(root, 'executables', 'only.zip'), 'zip')

  assert.equal((await run(['assets'], { cwd: root })).code, 0)

  fs.rmSync(path.join(root, 'executables', 'only.zip'))

  const result = await run(['assets'], { cwd: root })

  assert.equal(result.code, 1)
  assert.match(result.stderr, /only\.zip/)
})

const serve = (status, body) =>
  new Promise((resolve) => {
    const server = http.createServer((request, response) => {
      server.lastRequest = request
      response.writeHead(status, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify(body))
    })
    server.listen(0, '127.0.0.1', () =>
      resolve({
        server,
        apiUrl: `http://127.0.0.1:${server.address().port}`
      })
    )
  })

const release = (names) => ({
  tag_name: 'v7.24.4',
  assets: names.map((name) => ({ name, size: 1_000 }))
})

test('a published release carrying every asset passes', async () => {
  const root = checkout()
  const { server, apiUrl } = await serve(200, release(ASSETS))
  const result = await run(['published', 'v7.24.4'], {
    cwd: root,
    env: {
      GITHUB_API_URL: apiUrl,
      GITHUB_REPOSITORY: 'sasjs/server',
      GITHUB_TOKEN: 'token'
    }
  })
  server.close()

  assert.equal(result.code, 0)
  assert.match(result.stdout, /carries all 4 declared assets/)
})

test('a published release missing assets fails before npm publish', async () => {
  // The v7.24.3 shape again, read from the release itself.
  const root = checkout()
  const { server, apiUrl } = await serve(200, release([]))
  const result = await run(['published', 'v7.24.3'], {
    cwd: root,
    env: {
      GITHUB_API_URL: apiUrl,
      GITHUB_REPOSITORY: 'sasjs/server',
      GITHUB_TOKEN: 'token'
    }
  })
  server.close()

  assert.equal(result.code, 1)
  assert.match(result.stderr, /v7\.24\.3 is missing assets/)
  assert.match(result.stderr, /windows\.zip/)
})

test('a zero byte asset on the release counts as missing', async () => {
  const root = checkout()
  const { server, apiUrl } = await serve(
    200,
    { assets: ASSETS.map((name) => ({ name, size: name === 'linux.zip' ? 0 : 9 })) }
  )
  const result = await run(['published', 'v7.24.4'], {
    cwd: root,
    env: {
      GITHUB_API_URL: apiUrl,
      GITHUB_REPOSITORY: 'sasjs/server',
      GITHUB_TOKEN: 'token'
    }
  })
  server.close()

  assert.equal(result.code, 1)
  assert.match(result.stderr, /linux\.zip \(0 bytes\)/)
})

test('a release that cannot be read back is not a release that can ship', async () => {
  const root = checkout()
  const { server, apiUrl } = await serve(404, { message: 'Not Found' })
  const result = await run(['published', 'v7.24.5'], {
    cwd: root,
    env: {
      GITHUB_API_URL: apiUrl,
      GITHUB_REPOSITORY: 'sasjs/server',
      GITHUB_TOKEN: 'token'
    }
  })
  server.close()

  assert.equal(result.code, 1)
  assert.match(result.stderr, /HTTP 404/)
})

test('published without a tag fails rather than guessing one', async () => {
  const root = checkout()
  const result = await run(['published'], { cwd: root })

  assert.equal(result.code, 1)
  assert.match(result.stderr, /expects the tag/)
})

test('an unknown mode fails', async () => {
  const root = checkout()
  const result = await run(['everything'], { cwd: root })

  assert.equal(result.code, 1)
  assert.match(result.stderr, /unknown mode 'everything'/)
})
