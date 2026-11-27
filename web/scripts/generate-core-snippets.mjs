import { spawnSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { basename, dirname, isAbsolute, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const webRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const output = join(
  webRoot,
  'src',
  'containers',
  'Studio',
  'internal',
  'languages'
)
const folders = [
  'base',
  'ddl',
  'fcmp',
  'lua',
  'server',
  'meta',
  'metax',
  'viya',
  'xplatform'
]
const args = process.argv.slice(2)
if (args.length > 1 || (args.length && !isAbsolute(args[0])))
  throw new Error('Expected an optional absolute @sasjs/core package directory')
const selected = args[0] || process.env.SASJS_CORE_ROOT
if (selected && !isAbsolute(selected))
  throw new Error('SASJS_CORE_ROOT must be an absolute path')
const core = selected || join(webRoot, 'node_modules', '@sasjs', 'core')
const pkg = JSON.parse(readFileSync(join(core, 'package.json'), 'utf8'))
if (pkg.name !== '@sasjs/core' || typeof pkg.version !== 'string')
  throw new Error(`Invalid @sasjs/core package in ${core}`)
if (!selected && pkg.version !== '7.1.15')
  throw new Error(`Expected @sasjs/core 7.1.15, got ${pkg.version}`)
const cli =
  process.env.SASJS_CLI_ENTRY ||
  join(webRoot, 'node_modules', '@sasjs', 'cli', 'build', 'index.js')
if (!isAbsolute(cli))
  throw new Error('SASJS_CLI_ENTRY must be an absolute path')

// The CLI owns the snippet format. This separate index only adds suite labels.
const suites = {}
function indexSuite(dir, suite) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) indexSuite(path, suite)
    else if (
      entry.isFile() &&
      entry.name.endsWith('.sas') &&
      !/\.test\.(?:\d+\.)?sas$/i.test(entry.name)
    ) {
      const name = basename(entry.name, '.sas')
      if (Object.hasOwn(suites, name))
        throw new Error(`Duplicate macro ${name}`)
      suites[name] = suite
    }
  }
}
for (const folder of folders) indexSuite(join(core, folder), folder)
const temp = mkdtempSync(join(webRoot, '.core-snippets-'))
try {
  mkdirSync(join(temp, 'sasjs'))
  writeFileSync(
    join(temp, 'sasjs', 'sasjsconfig.json'),
    JSON.stringify({
      macroFolders: folders.map((folder) => join(core, folder)),
      defaultTarget: 'local',
      targets: [
        {
          name: 'local',
          serverType: 'SASJS',
          serverUrl: 'http://localhost:5000',
          appLoc: '/test'
        }
      ]
    })
  )
  const result = spawnSync(
    process.execPath,
    [cli, 'snippets', '-o', 'snippets.json'],
    { cwd: temp, encoding: 'utf8' }
  )
  if (result.error || result.status !== 0)
    throw new Error(
      `sasjs snippets failed: ${result.error || result.stdout + result.stderr}`
    )
  const generated = readFileSync(join(temp, 'snippets.json'), 'utf8')
  const snippets = JSON.parse(generated)
  const names = Object.keys(snippets).sort()
  if (JSON.stringify(names) !== JSON.stringify(Object.keys(suites).sort()))
    throw new Error('CLI snippet inventory differs from core suite index')
  for (const name of names) {
    const item = snippets[name]
    if (
      item.prefix !== `%${name}` ||
      typeof item.body !== 'string' ||
      !Array.isArray(item.description)
    )
      throw new Error(`Unexpected CLI snippet format for ${name}`)
  }
  writeFileSync(
    join(output, 'coreSnippets.json'),
    JSON.stringify(
      Object.fromEntries(names.map((name) => [name, snippets[name]])),
      null,
      2
    ) + '\n'
  )
  writeFileSync(
    join(output, 'coreSnippetSuites.json'),
    JSON.stringify(
      Object.fromEntries(names.map((name) => [name, suites[name]])),
      null,
      2
    ) + '\n'
  )
  console.log(
    `Generated ${names.length} snippets using sasjs snippets from @sasjs/core ${pkg.version}`
  )
} finally {
  rmSync(temp, { recursive: true, force: true })
}
