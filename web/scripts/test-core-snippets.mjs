import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { test } from 'node:test'

const generatorUrl = new URL('./generate-core-snippets.mjs', import.meta.url)
async function parse(source, filename = 'example.sas') {
  assert.ok(existsSync(generatorUrl), 'core snippet generator must exist')
  const { parseMacro } = await import(generatorUrl)
  return parseMacro(source, 'base', filename)
}

test('preserves optional blank keyword defaults rather than inserting values', async () => {
  assert.deepEqual(await parse('/** @brief Example. */\n%macro example(input, output=, mode=SAFE);\n%mend;'), {
    name: 'example', folder: 'base', description: 'Example.\nSignature: input, output=, mode=SAFE',
    insertText: '%example(${1:input})'
  })
})

test('real optional keyword defaults remain untouched in generated calls', async () => {
  const { generateManifest } = await import(generatorUrl)
  const items = new Map(generateManifest().map((item) => [item.name, item]))
  assert.equal(items.get('mf_writefile').insertText, '%mf_writefile(${1:fpath})')
  assert.match(items.get('mf_writefile').description, /l1=, l2=/)
  assert.equal(items.get('mp_ds2cards').insertText, '%mp_ds2cards(${1:base_ds})')
  assert.match(items.get('mp_ds2cards').description, /tgt_ds=/)
})

test('parses multiline signatures, nested macro quoting, quoted commas and comments', async () => {
  const item = await parse(`/** @brief Example. */
%macro example(
  first /* a, b=1 */, expr=%str((a,b)=c),
  tricky=%str(%(x%,y%)), text='x,y=z', empty= /* comment */
);`)
  assert.equal(item.insertText, '%example(${1:first})')
  assert.equal(item.description, "Example.\nSignature: first, expr=%str((a,b)=c), tricky=%str(%(x%,y%)), text='x,y=z', empty=")
})

test('places the final cursor inside calls with no positional parameters', async () => {
  for (const declaration of ['%macro example();', '%macro example(a=, b=SAFE);']) {
    const item = await parse(declaration)
    assert.equal(item.insertText, '%example($0)')
  }
  const { generateManifest } = await import(generatorUrl)
  const abort = generateManifest().find((item) => item.name === 'mp_abort')
  assert.equal(abort.insertText, '%mp_abort($0)')
})

test('supports zero parameters and ignores commented declarations', async () => {
  const item = await parse('/** @brief Example.\n%macro example(fake);\n*/\n%macro example();')
  assert.equal(item.insertText, '%example($0)')
})

test('ignores fake declarations inside string literals', async () => {
  const item = await parse(`/** @brief Example. */
%put '%macro example(fake);';
%macro example(real);`)
  assert.equal(item.insertText, '%example(${1:real})')
})

test('ignores comment markers in preceding literals when finding declarations', async () => {
  const item = await parse(`%put "literal /*";
/* ordinary comment */
%macro example(real, mode="safe");`)
  assert.equal(item.insertText, '%example(${1:real})')
  assert.match(item.description, /mode="safe"/)
})

test('preserves comment markers in quoted defaults and requires a terminated declaration', async () => {
  const item = await parse("/** @brief Example. */ %macro example(value='/*,=*/', blank=); ")
  assert.equal(item.insertText, '%example($0)')
  assert.match(item.description, /value='\/\*,=\*\//)
  await assert.rejects(() => parse('%macro example(a) invalid'), /parse|invalid|missing/i)
})

test('preserves meaningful spaces in default values', async () => {
  const item = await parse("/** @brief Example. */ %macro example(value='a  b', delim=%str(  ));")
  assert.match(item.description, /value='a  b', delim=%str\(  \)/)
})

test('rejects broken declarations rather than silently dropping parameters', async () => {
  for (const source of ['%macro example(a,,b);', '%macro example(a=foo(bar);', '%macro example(a, 123=x);', '%macro other();']) {
    await assert.rejects(() => parse(source), /parse|invalid|unbalanced|missing/i)
  }
})

test('inventory includes every source macro exactly once and rejects duplicates', async () => {
  const { generateManifest, folders } = await import(generatorUrl)
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs')
  const { join } = await import('node:path')
  // The host /tmp may be full; use a private temporary directory under the web package.
  const root = mkdtempSync(join(process.cwd(), '.core-snippets-test-'))
  try {
    for (const folder of folders) mkdirSync(join(root, folder))
    writeFileSync(join(root, 'base', 'example.sas'), '/** @brief Test */\n%macro example();')
    assert.deepEqual(generateManifest(root).map((item) => item.name), ['example'])
    writeFileSync(join(root, 'viya', 'example.sas'), '%macro example();')
    assert.throws(() => generateManifest(root), /duplicate/i)
    rmSync(join(root, 'viya', 'example.sas'))
    writeFileSync(join(root, 'meta', 'broken.sas'), 'no macro declaration')
    assert.throws(() => generateManifest(root), /missing/i)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('CLI generates from an explicitly selected installed core rather than the web pin', async () => {
  const { folders } = await import(generatorUrl)
  const { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } = await import('node:fs')
  const { join } = await import('node:path')
  const { spawnSync } = await import('node:child_process')
  const root = mkdtempSync(join(process.cwd(), '.core-snippets-cli-'))
  try {
    const scripts = join(root, 'web', 'scripts')
    const output = join(root, 'web', 'src', 'containers', 'Studio', 'internal', 'languages')
    const pinned = join(root, 'web', 'node_modules', '@sasjs', 'core')
    const selected = join(root, 'api', 'node_modules', '@sasjs', 'core')
    mkdirSync(scripts, { recursive: true })
    mkdirSync(output, { recursive: true })
    cpSync(generatorUrl, join(scripts, 'generate-core-snippets.mjs'))
    for (const [dir, version, macro] of [[pinned, '7.1.15', 'pinned'], [selected, '99.0.0', 'selected']]) {
      for (const folder of folders) mkdirSync(join(dir, folder), { recursive: true })
      writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: '@sasjs/core', version }))
      writeFileSync(join(dir, 'base', `${macro}.sas`), `%macro ${macro}(arg);`)
    }
    const run = (...args) => spawnSync(process.execPath, [join(scripts, 'generate-core-snippets.mjs'), ...args], { cwd: root, encoding: 'utf8' })
    const selectedRun = run(selected)
    assert.equal(selectedRun.status, 0, selectedRun.stderr)
    assert.match(selectedRun.stdout, /@sasjs\/core 99\.0\.0/)
    assert.deepEqual(JSON.parse(readFileSync(join(output, 'coreSnippets.json'))).map((x) => x.name), ['selected'])
    const defaultRun = run()
    assert.equal(defaultRun.status, 0, defaultRun.stderr)
    assert.deepEqual(JSON.parse(readFileSync(join(output, 'coreSnippets.json'))).map((x) => x.name), ['pinned'])
    const relativeRun = run('relative/path')
    assert.notEqual(relativeRun.status, 0, 'an explicit source must be absolute')
    assert.match(relativeRun.stderr, /absolute/)
    const extraRun = run(selected, selected)
    assert.notEqual(extraRun.status, 0, 'extra arguments must be rejected')
    writeFileSync(join(pinned, 'package.json'), JSON.stringify({ version: '99.0.0' }))
    const unpinnedRun = run()
    assert.notEqual(unpinnedRun.status, 0, 'the default source must remain pinned')
    assert.match(unpinnedRun.stderr, /Expected @sasjs\/core 7\.1\.15/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('committed manifest matches the installed package, covering all nine suites', async () => {
  const { generateManifest, folders, manifestPath, coreRoot } = await import(generatorUrl)
  const { readFileSync, readdirSync } = await import('node:fs')
  const { join } = await import('node:path')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  assert.deepEqual(manifest, generateManifest(coreRoot))
  const count = folders.reduce((total, folder) => total + readdirSync(join(coreRoot, folder)).filter((name) => name.endsWith('.sas')).length, 0)
  assert.equal(manifest.length, count)
  assert.deepEqual([...new Set(manifest.map((item) => item.folder))].sort(), [...folders].sort())
  assert.ok(manifest.every((item) => Object.keys(item).join(',') === 'name,folder,description,insertText'))
})
