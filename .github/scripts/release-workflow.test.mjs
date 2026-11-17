import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const workflow = readFileSync('.github/workflows/release.yml', 'utf8')
function step(name) {
  const start = workflow.indexOf(`      - name: ${name}\n`)
  assert.notEqual(start, -1, `missing step ${name}`)
  const next = workflow.indexOf('\n      - name:', start + 1)
  return workflow.slice(start, next === -1 ? undefined : next)
}
function script(stepText) {
  const lines = stepText.split('\n')
  const start = lines.findIndex((line) => line === '        run: |')
  assert.notEqual(start, -1)
  return lines.slice(start + 1).filter((line) => line.startsWith('          ') || !line.trim()).map((line) => line.slice(10)).join('\n')
}

test('semantic-release decides docs-only changes as well as code changes', () => {
  assert.doesNotMatch(step('Is a release pending?'), /if:.*docsOnly/)
  assert.doesNotMatch(workflow, /id: scope\b/)
})

test('release is never attempted without a pending build', () => {
  assert.match(step('Release'), /if: steps\.pending\.outputs\.release == 'true'/)
})

test('dry run requests a build for a release, skips known no-release, and fails on unknown output', () => {
  const dir = mkdtempSync(join(tmpdir(), 'server-release-dry-run-'))
  try {
    mkdirSync(join(dir, 'bin'))
    writeFileSync(join(dir, 'bin', 'semantic-release'), '#!/bin/sh\nprintf "%s\\n" "$DRY_OUTPUT"\n', { mode: 0o755 })
    const output = join(dir, 'output')
    const env = { ...process.env, PATH: `${join(dir, 'bin')}:${process.env.PATH}`, GITHUB_OUTPUT: output }
    const run = (text) => {
      writeFileSync(output, '')
      const shell = script(step('Is a release pending?')).replaceAll('/tmp/dry-run.log', join(dir, 'dry-run.log'))
      const result = spawnSync('bash', ['-c', shell], { cwd: dir, env: { ...env, DRY_OUTPUT: text }, encoding: 'utf8' })
      return { ...result, output: readFileSync(output, 'utf8') }
    }
    const pending = run('The next release version is 7.24.4')
    assert.equal(pending.status, 0)
    assert.match(pending.output, /release=true\nversion=v7\.24\.4/)
    const none = run('There are no relevant changes, so no new version is released.')
    assert.equal(none.status, 0)
    assert.match(none.output, /release=false/)
    const behind = run("The local branch main is behind the remote one, therefore a new version won't be published.")
    assert.equal(behind.status, 0)
    assert.match(behind.output, /release=false/)
    const unknown = run('unexpected semantic-release output')
    assert.notEqual(unknown.status, 0, unknown.stdout + unknown.stderr)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('release refuses incomplete or tampered artifacts before semantic-release writes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'server-release-guard-'))
  try {
    mkdirSync(join(dir, 'executables'))
    mkdirSync(join(dir, 'bin'))
    const output = join(dir, 'output')
    const called = join(dir, 'called')
    writeFileSync(join(dir, 'bin', 'semantic-release'), `#!/bin/sh\ntouch '${called}'\n`, { mode: 0o755 })
    writeFileSync(join(dir, 'bin', 'git'), '#!/bin/sh\nif [ "$1" = tag ]; then printf "v1.2.3\\n"; fi\n', { mode: 0o755 })
    const env = { ...process.env, PATH: `${join(dir, 'bin')}:${process.env.PATH}`, GITHUB_OUTPUT: output, GITHUB_SHA: 'abc', VERSION: 'v1.2.3' }
    const run = () => spawnSync('bash', ['-c', script(step('Release'))], { cwd: dir, env, encoding: 'utf8' })
    const missing = run()
    assert.notEqual(missing.status, 0, missing.stdout + missing.stderr)
    assert.throws(() => readFileSync(called))
    const names = ['linux.zip', 'macos.zip', 'windows.zip']
    const entries = names.map((name) => {
      const bytes = Buffer.from(`fixture ${name}`)
      writeFileSync(join(dir, 'executables', name), bytes)
      return `${createHash('sha256').update(bytes).digest('hex')}  ${name}`
    })
    writeFileSync(join(dir, 'executables', 'SHA256SUMS'), `${entries.join('\n')}\n`)
    mkdirSync(join(dir, 'npm-package'))
    writeFileSync(join(dir, 'npm-package', 'package.json'), '{}')
    writeFileSync(join(dir, 'executables', 'SHA256SUMS'), `${entries.slice(0, 2).join('\n')}\n`)
    const incomplete = run()
    assert.notEqual(incomplete.status, 0, incomplete.stdout + incomplete.stderr)
    assert.throws(() => readFileSync(called))
    writeFileSync(join(dir, 'executables', 'SHA256SUMS'), `${entries.join('\n')}\n`)
    writeFileSync(join(dir, 'executables', 'windows.zip'), 'tampered')
    const tampered = run()
    assert.notEqual(tampered.status, 0, tampered.stdout + tampered.stderr)
    assert.throws(() => readFileSync(called))
    writeFileSync(join(dir, 'executables', 'windows.zip'), 'fixture windows.zip')
    const ready = run()
    assert.equal(ready.status, 0, ready.stdout + ready.stderr)
    assert.doesNotThrow(() => readFileSync(called))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
