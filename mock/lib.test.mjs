/**
 * The retry that waits out a registry publish window, tested.
 *
 * The failure it exists for - `ETARGET: No matching version found` a minute
 * after a release - only appears in a deploy, so the classification is asserted
 * here instead: a command that fails with that message is retried, and any other
 * failure is not.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { run, runWhenTheRegistryIsReady } from './lib.mjs'

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
