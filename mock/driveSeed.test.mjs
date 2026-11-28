/**
 * What `/code` on the demo's drive carries.
 *
 * The drive is data the site ships, so this is the only place the rules about it
 * can be checked: which files reach a visitor's tree, and what an archive is left
 * out for. The walk is the code that decides, so this builds a tree with the
 * shapes that matter rather than trusting the published snapshot.
 */
import assert from 'node:assert/strict'
import { mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { DRIVE_ROOT, MAX_CODE_BYTES, withCodeSources } from './driveSeed.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))

const makeTree = () => {
  const root = path.join(here, '.tmp-code-tree')

  rmSync(root, { recursive: true, force: true })
  mkdirSync(path.join(root, 'base'), { recursive: true })
  mkdirSync(path.join(root, 'docs', 'deep'), { recursive: true })
  mkdirSync(path.join(root, 'packages'), { recursive: true })
  mkdirSync(path.join(root, '.git'), { recursive: true })

  writeFileSync(path.join(root, 'base', 'mp_abort.sas'), 'text')
  writeFileSync(path.join(root, 'docs', 'deep', 'note.md'), 'text')
  writeFileSync(path.join(root, 'packages', 'x.zip'), 'zip')
  writeFileSync(
    path.join(root, 'logo.png'),
    Buffer.from([0x89, 0x50, 0x4e, 0x47])
  )
  writeFileSync(path.join(root, '.git', 'HEAD'), 'ref: refs/heads/main')

  return root
}

test('the code trees land under /code, keeping their folders', () => {
  const root = makeTree()

  try {
    const drive = withCodeSources({ files: {} }, [
      { folder: 'macro-core', root },
      { folder: 'sas-packages', root: path.join(root, 'docs') }
    ])

    const keys = Object.keys(drive.files)

    assert.ok(keys.includes(`${DRIVE_ROOT}/code/macro-core/base/mp_abort.sas`))
    assert.ok(
      keys.includes(`${DRIVE_ROOT}/code/macro-core/docs/deep/note.md`),
      'a nested folder keeps its path'
    )
    assert.ok(keys.includes(`${DRIVE_ROOT}/code/sas-packages/deep/note.md`))
    assert.equal(
      drive.files[`${DRIVE_ROOT}/code/macro-core/base/mp_abort.sas`],
      'text'
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('an archive and a git folder are left out', () => {
  const root = makeTree()

  try {
    const drive = withCodeSources({}, [{ folder: 'macro-core', root }])
    const keys = Object.keys(drive.files)

    assert.equal(
      keys.some((key) => key.endsWith('.zip')),
      false,
      'a package archive is a download, not something a tree shows'
    )
    assert.equal(
      keys.some((key) => key.includes('/.git/')),
      false,
      'this repository carries a .git folder; the drive does not need one'
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('bytes that are not UTF-8 travel as the base64 marker the drive reads', () => {
  const root = makeTree()

  try {
    const drive = withCodeSources({}, [{ folder: 'macro-core', root }])
    const logo = drive.files[`${DRIVE_ROOT}/code/macro-core/logo.png`]

    assert.ok(logo.startsWith('\u0000base64:'), 'a PNG is not text')
    assert.equal(
      Buffer.from(logo.slice('\u0000base64:'.length), 'base64').toString('hex'),
      '89504e47'
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a symlink is skipped, so a tree cannot publish what it does not hold', () => {
  const root = makeTree()
  const outside = path.join(here, '.tmp-outside')

  try {
    rmSync(outside, { recursive: true, force: true })
    mkdirSync(outside, { recursive: true })
    writeFileSync(path.join(outside, 'secret.sas'), 'not part of the tree')

    // a link to a folder is the one that broke the walk outright: readFileSync
    // on a directory throws EISDIR, so the build failed rather than skipping it
    symlinkSync(outside, path.join(root, 'linked-folder'))
    symlinkSync(
      path.join(outside, 'secret.sas'),
      path.join(root, 'linked-file.sas')
    )

    const drive = withCodeSources({}, [{ folder: 'macro-core', root }])
    const keys = Object.keys(drive.files)

    assert.equal(
      keys.some((key) => key.includes('linked-folder')),
      false,
      'a directory link is not walked'
    )
    assert.equal(
      keys.some((key) => key.includes('linked-file')),
      false,
      'a file link is not copied, because its bytes live outside the tree'
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
    rmSync(outside, { recursive: true, force: true })
  }
})

test('a tree past the bound fails the build rather than publishing', () => {
  const root = makeTree()

  try {
    // just over the line, in one file: the failure has to name the folder it
    // happened in, because the message is all a maintainer gets
    writeFileSync(
      path.join(root, 'base', 'huge.sas'),
      Buffer.alloc(MAX_CODE_BYTES + 1, 0x20)
    )

    assert.throws(
      () => withCodeSources({}, [{ folder: 'macro-core', root }]),
      /passed \d+ bytes at macro-core\/base\/huge\.sas/
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a source can name the folders it does not want', () => {
  const root = makeTree()

  try {
    const drive = withCodeSources({}, [
      { folder: 'macro-core', root, skip: ['docs/'] }
    ])
    const keys = Object.keys(drive.files)

    assert.ok(keys.includes(`${DRIVE_ROOT}/code/macro-core/base/mp_abort.sas`))
    assert.equal(
      keys.some((key) => key.includes('/docs/')),
      false,
      'the framework ships papers and screenshots beside its code; a skip keeps them off the drive'
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a source can carry a file it does not hold on disk', () => {
  const root = makeTree()

  try {
    const rules = '{"maxLineLength": 169}'
    const drive = withCodeSources({}, [
      { folder: 'toolbox', root, additions: { '.sasjslint': rules } }
    ])
    const keys = Object.keys(drive.files)

    // at the folder's own root: a `.sasjslint` is the rules file for
    // everything beneath it, so a visitor's tree finds it where the host walks
    assert.equal(drive.files[`${DRIVE_ROOT}/code/toolbox/.sasjslint`], rules)
    // and the files the source does hold still land beside it
    assert.ok(keys.includes(`${DRIVE_ROOT}/code/toolbox/base/mp_abort.sas`))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('an addition is counted against the bound like any other file', () => {
  const root = makeTree()

  try {
    assert.throws(
      () =>
        withCodeSources({}, [
          {
            folder: 'toolbox',
            root,
            additions: { '.sasjslint': 'x'.repeat(MAX_CODE_BYTES + 1) }
          }
        ]),
      /passed \d+ bytes at toolbox\/\.sasjslint/
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
