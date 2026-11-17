// Jest's module runtime cannot load the real ESM formatter; exercise the route
// in a normal Node process so a passing test includes both published packages.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

process.env.NODE_ENV = 'test'
process.env.MODE = 'desktop'
process.env.HTTP_PORT = '5000'
require('ts-node/register')
const request = require('supertest')

async function main() {
  // NODE_ENV=test derives the drive from cwd. Keep this test independent of a
  // developer's local drive and its .sasjslint, and leave no fixture behind.
  const originalCwd = process.cwd()
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sasjs-format-api-'))
  process.chdir(tmp)
  try {
    const app = await require('../src/app').default
    // The controller falls back to lint-only if loading fails; do not let that
    // fallback make this test pass without ever loading the layout engine.
    assert.equal(
      typeof (await require('../src/utils/formatEngine').getFormatEngine()),
      'function'
    )
    const source = '%macro example();\n%first()\n%second()\n%let x=1;\n%mend;\n'
    const response = await request(app)
      .post('/SASjsApi/code/format')
      .send({ code: source })
      .expect(200)
    assert.match(response.body, /%first\(\)\s*\n\s*%second\(\)\s*\n\s*%let\b/i)
    const again = await request(app)
      .post('/SASjsApi/code/format')
      .send({ code: response.body })
      .expect(200)
    assert.equal(again.body, response.body)

    const header =
      '/**\n  @file example\n    @details Details\n      code sample\n**/\n'
    const formattedHeader = await request(app)
      .post('/SASjsApi/code/format')
      .send({ code: `${header}%macro example();\n%mend;\n` })
      .expect(200)
    assert.ok(
      formattedHeader.body.startsWith(header),
      'header indentation must survive formatting'
    )
    console.log(
      'Real format API preserves standalone macro calls and header indentation; formatting is idempotent'
    )
  } finally {
    process.chdir(originalCwd)
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}

// Fail instead of holding a CI runner forever if an unexpected handle remains.
const deadline = setTimeout(() => {
  console.error('Format API smoke test timed out')
  process.exit(1)
}, 30000)
deadline.unref()
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
