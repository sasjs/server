import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const cli =
  process.env.SASJS_CLI_ENTRY ||
  fileURLToPath(
    new URL('../node_modules/@sasjs/cli/build/index.js', import.meta.url)
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

test('build and start explicitly regenerate even when npm ignores lifecycle scripts', () => {
  const scripts = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  ).scripts
  for (const name of ['build', 'start'])
    assert.match(scripts[name], /^npm run generate:core-snippets && /)
})

test('generates unmodified VS Code snippets with the actual CLI for the selected core', () => {
  assert.ok(
    cli,
    'set SASJS_CLI_ENTRY to the installed @sasjs/cli build/index.js'
  )
  const root = mkdtempSync(join(process.cwd(), '.core snippets test-'))
  try {
    const web = join(root, 'web')
    const scripts = join(web, 'scripts')
    const output = join(web, 'src/containers/Studio/internal/languages')
    const core = join(root, 'api/node_modules/@sasjs/core')
    mkdirSync(scripts, { recursive: true })
    mkdirSync(output, { recursive: true })
    cpSync(
      new URL('./generate-core-snippets.mjs', import.meta.url),
      join(scripts, 'generate-core-snippets.mjs')
    )
    mkdirSync(core, { recursive: true })
    writeFileSync(
      join(core, 'package.json'),
      JSON.stringify({ name: '@sasjs/core', version: '99.0.0' })
    )
    for (const folder of folders) {
      mkdirSync(join(core, folder), { recursive: true })
      writeFileSync(
        join(core, folder, `${folder}example.sas`),
        `/**\n  @brief ${folder} description\n*/\n%macro ${folder}example(first, option=); %mend;`
      )
    }
    writeFileSync(join(core, 'base', 'zlast.sas'), '%macro zlast(); %mend;')
    writeFileSync(join(core, 'base', 'afirst.sas'), '%macro afirst(); %mend;')
    for (const name of ['afirst.test.sas', 'afirst.test.1.sas', 'afirst.test.10.sas'])
      writeFileSync(join(core, 'base', name), '%put test;')
    const run = spawnSync(
      process.execPath,
      [join(scripts, 'generate-core-snippets.mjs'), core],
      {
        cwd: web,
        env: { ...process.env, SASJS_CLI_ENTRY: cli },
        encoding: 'utf8'
      }
    )
    assert.equal(run.status, 0, run.stdout + run.stderr)
    const data = JSON.parse(
      readFileSync(join(output, 'coreSnippets.json'), 'utf8')
    )
    assert.deepEqual(data.baseexample, {
      prefix: '%baseexample',
      body: '%baseexample(${1:first})',
      description: ['base description']
    })
    assert.equal(Object.keys(data).length, folders.length + 2)
    const suites = JSON.parse(
      readFileSync(join(output, 'coreSnippetSuites.json'), 'utf8')
    )
    assert.equal(suites.viyaexample, 'viya')
    assert.equal(Object.keys(suites).length, folders.length + 2)
    assert.deepEqual(Object.keys(data), Object.keys(data).sort())
    assert.deepEqual(Object.keys(suites), Object.keys(suites).sort())
    const before = ['coreSnippets.json', 'coreSnippetSuites.json'].map((file) =>
      readFileSync(join(output, file))
    )
    const reverse = join(root, 'reverse.cjs')
    writeFileSync(
      reverse,
      `const fs = require('node:fs')\nconst original = fs.readdirSync\nfs.readdirSync = (...args) => original(...args).reverse()\nrequire('node:module').syncBuiltinESMExports()\n`
    )
    const second = spawnSync(
      process.execPath,
      [join(scripts, 'generate-core-snippets.mjs'), core],
      {
        cwd: web,
        env: {
          ...process.env,
          SASJS_CLI_ENTRY: cli,
          NODE_OPTIONS: `--require=${JSON.stringify(reverse)}`
        },
        encoding: 'utf8'
      }
    )
    assert.equal(second.status, 0, second.stdout + second.stderr)
    assert.deepEqual(
      ['coreSnippets.json', 'coreSnippetSuites.json'].map((file) =>
        readFileSync(join(output, file))
      ),
      before
    )
    writeFileSync(
      join(core, 'viya', 'baseexample.sas'),
      '%macro baseexample();'
    )
    const duplicate = spawnSync(
      process.execPath,
      [join(scripts, 'generate-core-snippets.mjs'), core],
      {
        cwd: web,
        env: { ...process.env, SASJS_CLI_ENTRY: cli },
        encoding: 'utf8'
      }
    )
    assert.notEqual(duplicate.status, 0)
    assert.match(duplicate.stderr, /Duplicate macro/)
    assert.deepEqual(
      JSON.parse(readFileSync(join(output, 'coreSnippets.json'), 'utf8')),
      data
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
