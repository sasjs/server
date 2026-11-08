#!/usr/bin/env node
/**
 * Runs MkDocs from the local toolchain, with the arguments given.
 *
 * The site is Python, and the interface's toolchain is Node, so the docs
 * toolchain is installed separately - normally into `.venv-docs`, which the
 * README tells a writer to create. An npm script that called the ambient
 * `python3` would find no mkdocs on a machine set up exactly that way, so every
 * docs script goes through here: the venv's interpreter when it exists, the
 * ambient one otherwise (which is the CI case, where pip installed into it).
 *
 *   node docs/scripts/mkdocs.mjs build --strict -f docs/mkdocs.yml
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

const isWindows = process.platform === 'win32'
const venvPython = path.join(
  '.venv-docs',
  isWindows ? 'Scripts' : 'bin',
  isWindows ? 'python.exe' : 'python'
)

const python = existsSync(venvPython)
  ? venvPython
  : isWindows
    ? 'python'
    : 'python3'

const result = spawnSync(python, ['-m', 'mkdocs', ...process.argv.slice(2)], {
  stdio: 'inherit'
})

if (result.error) {
  console.error(
    `Could not run ${python} -m mkdocs: ${result.error.message}\n` +
      'Install the toolchain with: python3 -m venv .venv-docs && .venv-docs/bin/pip install -r docs/requirements.txt'
  )
  process.exit(1)
}

process.exit(result.status ?? 1)
