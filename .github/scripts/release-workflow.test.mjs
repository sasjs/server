// Asserts the shape of .github/workflows/release.yml, because nothing else
// does: the workflow only runs on a push to the default branch, so a change
// that breaks it merges with every pull-request check green - which is how an
// assetless release reached `latest` on 17 November 2026.
//
// The properties pinned here are the ones that make that impossible:
//   * the release is cut as a DRAFT with no assets, before anything is built,
//     so a release cannot be published ahead of its files;
//   * every build step waits for a tag, so a run with nothing to release does
//     no work;
//   * the assets are attached and their digests verified before npm sees the
//     version, and the release is published only after the publish;
//   * publishing is decided by the registry (`--prepare-publish`), not by the
//     run having cut a tag, so an interrupted release can be finished by a
//     re-run.
//
// The last case runs the real tool against a copy of `.releaserc`, so the asset
// list is checked as the tool reads it rather than as a shape this file assumes.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const workflow = readFileSync('.github/workflows/release.yml', 'utf8')
const releaserc = JSON.parse(readFileSync('.releaserc', 'utf8'))

const at = (needle) => {
  const index = workflow.indexOf(needle)
  assert.notEqual(index, -1, `the workflow no longer contains ${needle}`)
  return index
}

function step(name) {
  const start = at(`      - name: ${name}\n`)
  const next = workflow.indexOf('\n      - name:', start + 1)
  return workflow.slice(start, next === -1 ? undefined : next)
}

/**
 * Every `run:` script in the workflow, block or inline.
 *
 * A claim about what the pipeline RUNS has to be made against these, not against
 * the file: most steps here are `run: |` blocks, so a per-line regex sees the
 * first line of a script and reads the rest as if it were prose. That is exactly
 * how "nothing calls semantic-release" would pass on a body that did.
 */
function runScripts() {
  const lines = workflow.split('\n')
  const scripts = []

  for (let i = 0; i < lines.length; i++) {
    const match = /^(\s*)(?:- )?run: (.*)$/.exec(lines[i])
    if (!match) continue

    const indent = match[1].length
    const rest = match[2].trim()

    if (rest !== '|' && rest !== '>') {
      scripts.push(rest)
      continue
    }

    const body = []
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() === '') {
        body.push('')
        continue
      }
      if (lines[j].search(/\S/) <= indent) break
      body.push(lines[j])
    }
    scripts.push(body.join('\n'))
  }

  return scripts
}

test('the release is cut as a draft with no assets, before anything is built', () => {
  const cut = step('Tag and cut the draft release, if there is anything to release')
  assert.match(cut, /--release --no-assets --draft/)
  assert.ok(
    at('name: Tag and cut the draft release') < at('name: Build WEB'),
    'the cut must come before the build, so the artefacts can name the release'
  )
})

test('nothing is built when this run has no tag to finish', () => {
  for (const name of [
    'Build WEB',
    'Build DOCS',
    'Build Executables',
    'Smoke test the linux executable',
    'Stage the npm package',
    'Compress Executables',
    'Generate SHA256 checksums',
    'Attach the assets to the draft, and verify them'
  ]) {
    assert.match(
      step(name),
      /if: steps\.publish\.outputs\.tag != ''/,
      `${name} must wait for a tag`
    )
  }
})

test('release snippets use the API core selected before either build', () => {
  const names = ['Install Dependencies API', 'Take the newest @sasjs/core', 'Install Dependencies WEB', 'Generate release core snippets', 'Build WEB', 'Build Executables']
  for (const name of names) {
    assert.match(step(name), /^        if: steps\.publish\.outputs\.tag != ''$/m, `${name} must wait for a tag`)
  }
  for (let i = 1; i < names.length; i++) {
    assert.ok(at(`name: ${names[i - 1]}\n`) < at(`name: ${names[i]}\n`), `${names[i - 1]} must precede ${names[i]}`)
  }
  assert.match(step('Install Dependencies API'), /^        working-directory: \.\/api\n        run: npm ci$/m)
  assert.match(step('Take the newest @sasjs/core'), /^        run: node \.github\/scripts\/take-latest-core\.mjs$/m)
  const generate = step('Generate release core snippets')
  assert.match(generate, /^        working-directory: \.\/web$/m)
  assert.match(generate, /^        run: npm run generate:core-snippets -- "\$GITHUB_WORKSPACE\/api\/node_modules\/@sasjs\/core"$/m)
  assert.match(step('Build WEB'), /SASJS_CORE_ROOT: \$\{\{ github\.workspace \}\}\/api\/node_modules\/@sasjs\/core/)
})

test('the exact release ZIPs are attested and the bundle is verified in both attachments', () => {
  const permissionBlock = workflow.slice(at('  release:\n'), at('    strategy:'))
  assert.match(permissionBlock, /^      contents: write\b/m)
  assert.match(permissionBlock, /^      id-token: write\b/m)
  assert.match(permissionBlock, /^      attestations: write\b/m)

  const attest = step('Attest the release ZIPs')
  assert.match(attest, /^        if: steps\.publish\.outputs\.tag != ''$/m)
  assert.match(attest, /^        id: attest$/m)
  assert.match(attest, /^        uses: sasjs\/release\/\.github\/actions\/attest-assets@[0-9a-f]{40}(?:\s+#.*)?$/m)
  assert.match(attest, /^          version: \$\{\{ steps\.publish\.outputs\.version \}\}$/m)
  const subjects = attest.match(/^          subject-path: \|\n((?:            [^\n]+\n)+)/m)
  assert.ok(subjects, 'the attestation must name its ZIPs explicitly')
  assert.deepEqual(subjects[1].trim().split('\n').map((line) => line.trim()),
    releaserc.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === '@sasjs/release')[1].assets
      .map((asset) => asset.path).filter((path) => path.endsWith('.zip')))
  assert.ok(subjects[1].includes('linux.zip') && subjects[1].includes('macos.zip') && subjects[1].includes('windows.zip'))

  for (const name of ['Attach the assets to the draft, and verify them', 'Publish the verified release']) {
    const attach = step(name)
    assert.match(attach, /^          BUNDLE: \$\{\{ steps\.attest\.outputs\.bundle-path \}\}$/m)
    assert.match(attach, /--asset "\$BUNDLE"/)
    assert.match(attach, /--verify-assets/)
  }
  assert.ok(at('name: Compress Executables') < at('name: Attest the release ZIPs'))
  assert.ok(at('name: Attest the release ZIPs') < at('name: Attach the assets to the draft'))
})

test('the assets are verified before npm sees the version, and published after it', () => {
  const attach = step('Attach the assets to the draft, and verify them')
  assert.match(attach, /--attach "\$TAG" --verify-assets --keep-draft/)

  const publish = step('Publish to npm')
  const finish = step('Publish the verified release')
  assert.match(finish, /--attach "\$TAG" --verify-assets/)
  assert.doesNotMatch(finish, /--keep-draft/)

  assert.ok(
    at('name: Attach the assets to the draft') < at('name: Publish to npm'),
    'npm must not be published before the release is known to carry its assets'
  )
  assert.ok(
    at('name: Publish to npm') < at('name: Publish the verified release'),
    'the release is published only after the version reached npm'
  )
  assert.ok(publish)
})

test('publishing is decided by the registry, not by this run cutting a tag', () => {
  const publish = step('Publish to npm')
  assert.match(publish, /if: steps\.publish\.outputs\.publish == 'true'/)
  assert.doesNotMatch(workflow, /steps\.release\.outputs\.released/)
})

test('the resolve step fails on a decision it cannot classify', () => {
  // The step's answer is what every later gate reads, so an exit 0 with no
  // `skip=` line - a tool change, a dropped --output - must not leave the run
  // green having released nothing. Executed, not read: the guard is bash.
  const body = (() => {
    const lines = step('Resolve the version this run publishes, and ask the registry').split('\n')
    const start = lines.findIndex((line) => line === '        run: |')
    assert.notEqual(start, -1)
    return lines
      .slice(start + 1)
      .filter((line) => line.startsWith('          ') || !line.trim())
      .map((line) => line.slice(10))
      .join('\n')
  })()

  const dir = mkdtempSync(join(tmpdir(), 'server-resolve-'))
  try {
    mkdirSync(join(dir, 'bin'))
    const output = join(dir, 'github-output')
    const install = (decision) =>
      writeFileSync(
        join(dir, 'bin', 'npm'),
        [
          '#!/bin/sh',
          '# stand-in for sasjs-release: write the decision where --output says',
          'out=""',
          'while [ $# -gt 0 ]; do',
          '  case "$1" in --output) shift; out="$1" ;; esac',
          '  shift',
          'done',
          `printf '%s' '${decision}' > "$out"`,
          ''
        ].join('\n'),
        { mode: 0o755 }
      )

    const run = (decision) => {
      install(decision)
      writeFileSync(output, '')
      const result = spawnSync('bash', ['-c', body], {
        cwd: dir,
        encoding: 'utf8',
        env: {
          ...process.env,
          PATH: `${join(dir, 'bin')}:${process.env.PATH}`,
          GITHUB_OUTPUT: output,
          TAG: '',
          SHA: 'abc123'
        }
      })
      return { ...result, written: readFileSync(output, 'utf8') }
    }

    const decision = (...entries) => entries.join('\n')

    const nothing = run(decision('skip=true', 'tag=', 'version=', 'publish=false', 'exists=false'))
    assert.equal(nothing.status, 0, nothing.stdout + nothing.stderr)
    assert.match(nothing.written, /skip=true/)

    const releasing = run(
      decision('skip=false', 'tag=v1.2.3', 'version=1.2.3', 'publish=true', 'exists=false')
    )
    assert.equal(releasing.status, 0, releasing.stdout + releasing.stderr)
    assert.match(releasing.written, /tag=v1\.2\.3/)
    assert.match(releasing.written, /publish=true/)

    const silent = run('')
    assert.notEqual(silent.status, 0, 'an exit 0 with no decision must fail the step')
    assert.match(silent.stderr + silent.stdout, /reported no skip= decision/)

    const noTag = run(decision('skip=false', 'version=1.2.3', 'publish=true'))
    assert.notEqual(noTag.status, 0, 'something to publish with no tag must fail the step')
    assert.match(noTag.stderr + noTag.stdout, /named no tag/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('the tool comes from the lockfile, and no run script calls semantic-release', () => {
  const scripts = runScripts()

  // the extractor has to see the multi-line bodies, or the next assertion is
  // about the first line of each block and nothing else
  assert.ok(scripts.length > 8, `expected the workflow's run scripts, got ${scripts.length}`)
  assert.ok(
    scripts.some((script) => script.includes('--prepare-publish')),
    'a multi-line body is extracted whole'
  )

  assert.match(step('Install the release tool'), /run: npm ci/)
  assert.doesNotMatch(scripts.join('\n'), /npm i -g semantic-release/)
  assert.doesNotMatch(scripts.join('\n'), /\bsemantic-release\b/)
  assert.match(readFileSync('package.json', 'utf8'), /"release": "sasjs-release"/)
})

test('the artefacts name the release they were built for', () => {
  assert.match(
    step('Build Executables'),
    /SASJS_SERVER_VERSION: \$\{\{ steps\.publish\.outputs\.tag \}\}/
  )
  assert.match(
    step('Stage the npm package'),
    /VERSION: \$\{\{ steps\.publish\.outputs\.version \}\}/
  )
})

test('the asset list is one the release tool reads', () => {
  const entry = (releaserc.plugins ?? []).find(
    (plugin) => Array.isArray(plugin) && plugin[0] === '@sasjs/release'
  )
  assert.ok(entry, '.releaserc must name @sasjs/release')
  const paths = entry[1].assets.map((asset) => asset.path)
  assert.deepEqual(paths, [
    './executables/linux.zip',
    './executables/macos.zip',
    './executables/windows.zip',
    './executables/SHA256SUMS'
  ])

  // The tool, run where those files do not exist yet, refuses by name - which
  // is how this asserts it read the config rather than assuming a shape.
  const dir = mkdtempSync(join(tmpdir(), 'server-releaserc-'))
  try {
    execFileSync('git', ['init', '-q', '.'], { cwd: dir })
    copyFileSync('.releaserc', join(dir, '.releaserc'))
    writeFileSync(join(dir, 'README.md'), 'fixture\n')
    execFileSync('git', ['add', '-A'], { cwd: dir })
    execFileSync(
      'git',
      ['-c', 'user.name=test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'feat: fixture'],
      { cwd: dir }
    )
    mkdirSync(join(dir, 'executables'))
    const result = spawnSync(
      process.execPath,
      [join(process.cwd(), 'node_modules', '@sasjs', 'release', 'release.mjs'),
       '--dry-run', '--release', '--host', 'github'],
      { cwd: dir, encoding: 'utf8' }
    )
    assert.notEqual(result.status, 0, result.stdout + result.stderr)
    assert.match(result.stderr + result.stdout, /executables\/linux\.zip/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
