import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { test } from 'node:test'
import { waitForDevTools } from './browser-start.mjs'

test('discovers the DevTools address from split stderr output without a profile file', async () => {
  const child = spawn(process.execPath, [
    '-e',
    `process.stderr.write('diagnostic\\nDevTools list'); setTimeout(() => process.stderr.write('ening on ws://127.0.0.1:43210/devtools/browser/example\\n'), 20); setTimeout(() => {}, 10000)`
  ])
  try {
    assert.equal(await waitForDevTools(child, 1000), 43210)
  } finally {
    child.kill()
    await once(child, 'exit')
  }
})

test('reports browser exit and its diagnostic output', async () => {
  const child = spawn(process.execPath, ['-e', `console.error('profile denied'); process.exit(17)`])
  await assert.rejects(waitForDevTools(child, 1000), /exited.*17[\s\S]*profile denied/)
})

test('reports timeout and its diagnostic output', async () => {
  const child = spawn(process.execPath, ['-e', `console.error('still starting'); setTimeout(() => {}, 10000)`])
  try {
    await assert.rejects(waitForDevTools(child, 1000), /timed out[\s\S]*still starting/)
  } finally {
    child.kill()
    await once(child, 'exit')
  }
})
