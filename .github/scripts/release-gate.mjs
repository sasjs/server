// Guards the release job against publishing something it cannot ship.
//
// Both holes fixed here let v7.24.3 out: the merge was documentation only, the
// build steps were skipped as intended - and semantic-release still read
// `fix(docs): ...` as a fix and cut a release with no executable assets. The
// release became `latest`, so the install commands in README.md and
// docs/pages/installation.md answered 404 for every platform, and the CLI's
// Windows job could not download a server to test against.
//
//   1. `scope` decides whether this push releases at all, from the changed file
//      list. release.yml's release step reads the answer the build steps read,
//      so a guard cannot half-apply again.
//   2. `assets` and `published` require the files .releaserc declares.
//      @semantic-release/github uploads the assets it finds and says nothing
//      about the ones it does not, so an empty executables/ folder produced a
//      release that was created, documented and published to npm as complete.
//
// usage:
//   node .github/scripts/release-gate.mjs scope      < changed-files.txt
//   git diff --name-only -z <range> | node .github/scripts/release-gate.mjs scope
//   node .github/scripts/release-gate.mjs assets
//   node .github/scripts/release-gate.mjs published  <tag>
//
// `scope` reads the changed paths on stdin, NUL- or newline-separated, and
// appends `releasable=` to $GITHUB_OUTPUT when it is set or prints it otherwise,
// so the same decision can be run by hand. Prefer `git diff --name-only -z`:
// without `-z` git quotes any path carrying a non-ASCII byte, a quote or a
// backslash, and `"docs/caf\303\251.md"` does not start with `docs/` - which is
// how a documentation-only merge with an accented filename slipped past the
// prefix test. The newline form is still read, and its quoting decoded, so a
// hand-run command answers the same as the workflow.
import fs from 'node:fs'
import path from 'node:path'

const [mode, argument] = process.argv.slice(2)

const fail = (message) => {
  console.error(`::error title=release-gate::${message}`)
  process.exit(1)
}

// The expected assets are read from .releaserc rather than listed again here:
// that file is what the release uploads, so an asset cannot be declared for
// publication and left out of this check.
const declaredAssets = () => {
  const configPath = path.resolve('.releaserc')
  let config

  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  } catch (error) {
    fail(`cannot read .releaserc from ${configPath}: ${error.message}`)
  }

  const github = (config.plugins ?? []).find(
    (plugin) =>
      Array.isArray(plugin) && plugin[0] === '@semantic-release/github'
  )
  const assets = github?.[1]?.assets ?? []

  if (!assets.length) fail(`${configPath} declares no release assets`)

  return assets.map((asset) =>
    typeof asset === 'string' ? asset : asset.path
  )
}

// git prints a path unquoted only when it holds nothing exotic; a non-ASCII
// byte, a quote, a backslash or a control character and it wraps the name in
// double quotes with C-style escapes. Undoing that here means the newline form
// gives the same answer as `-z`, so a hand-run command cannot disagree with the
// workflow.
const unquote = (path) => {
  if (!path.startsWith('"') || !path.endsWith('"') || path.length < 2) return path

  return path.slice(1, -1).replace(
    /\\[tnr"]|\\[0-7]{1,3}/g,
    (escape) => {
      if (escape.length > 2) {
        return String.fromCharCode(parseInt(escape.slice(1), 8))
      }

      switch (escape[1]) {
        case 't':
          return '\t'
        case 'n':
          return '\n'
        case 'r':
          return '\r'
        case '"':
          return '"'
        default:
          return '\\'
      }
    }
  )
}

// A path is documentation when it lives under docs/. Nothing else is: a merge
// that also touches a workflow, a mock, a lockfile or a source file changed
// something a user runs, so it releases.
const scope = () => {
  const input = fs.readFileSync(0, 'utf8')

  // `-z` is NUL-separated and never quotes; the newline form needs both.
  const changed = (input.includes('\0') ? input.split('\0') : input.split('\n'))
    .map((entry) => unquote(entry.trim()))
    .filter(Boolean)

  const releasable = changed.some((file) => !file.startsWith('docs/'))
  const value = `releasable=${releasable ? 'true' : 'false'}`
  const output = process.env.GITHUB_OUTPUT

  if (output) fs.appendFileSync(output, value + '\n')
  else console.log(value)

  if (!changed.length) {
    console.log('release-gate: no files changed, so there is nothing to release')
  } else if (releasable) {
    const code = changed.filter((file) => !file.startsWith('docs/')).length
    console.log(
      `release-gate: ${code} of ${changed.length} changed files are outside docs/, so this push releases`
    )
  } else {
    console.log(
      `release-gate: only documentation changed (${changed.length} file${changed.length === 1 ? '' : 's'}), so no release`
    )
  }
}

// Run in the checkout, after the build steps, before semantic-release: this is
// the state the release is about to publish.
const assets = () => {
  const problems = []

  for (const asset of declaredAssets()) {
    const file = path.resolve(asset)

    if (!fs.existsSync(file)) {
      problems.push(`${asset} (absent)`)
      continue
    }

    const { size } = fs.statSync(file)

    if (!size) problems.push(`${asset} (empty)`)
    else console.log(`release-gate: ${asset} is ${size} bytes`)
  }

  if (problems.length) {
    fail(
      `the release would publish without assets .releaserc declares: ${problems.join(', ')}. Refusing to cut a release that cannot ship.`
    )
  }
}

// Run against the published release, before `npm publish`: @semantic-release
// declines silently and releases silently, so the tag is the only evidence that
// a release happened at all - and this reads back what it actually carries.
const published = async () => {
  const tag = argument

  if (!tag) fail('published expects the tag to read back')

  const apiUrl = process.env.GITHUB_API_URL ?? 'https://api.github.com'
  const repo = process.env.GITHUB_REPOSITORY
  const token = process.env.GITHUB_TOKEN

  if (!repo) fail('GITHUB_REPOSITORY is not set, so the release cannot be read back')
  if (!token) fail('GITHUB_TOKEN is not set, so the release cannot be read back')

  const expected = declaredAssets().map((asset) => path.basename(asset))
  const response = await fetch(
    `${apiUrl}/repos/${repo}/releases/tags/${encodeURIComponent(tag)}`,
    {
      headers: {
        Authorization: `bearer ${token}`,
        Accept: 'application/vnd.github+json'
      }
    }
  )

  if (!response.ok) {
    fail(
      `cannot read the release for ${tag}: HTTP ${response.status}. A release that cannot be checked is not a release that can be published.`
    )
  }

  const release = await response.json()
  const uploaded = new Map(
    (release.assets ?? []).map((asset) => [asset.name, asset.size])
  )
  const problems = expected
    .filter((name) => !uploaded.has(name) || !uploaded.get(name))
    .map((name) => (uploaded.has(name) ? `${name} (0 bytes)` : name))

  if (problems.length) {
    fail(
      `the release ${tag} is missing assets .releaserc declares: ${problems.join(', ')}. Not publishing to npm: an install that downloads nothing is worse than no release.`
    )
  }

  console.log(
    `release-gate: ${tag} carries all ${expected.length} declared assets: ${expected.join(', ')}`
  )
}

if (mode === 'scope') scope()
else if (mode === 'assets') assets()
else if (mode === 'published') await published()
else fail(`unknown mode '${mode ?? ''}' - expected scope, assets or published`)
