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

    // A semicolon-less macro value must not swallow its closing %end.
    const macro = [
      '%macro f();',
      '%if &type=N %then %do;',
      '&valn',
      '%end;',
      '%else %if &type=C %then %do;',
      '&valc',
      '%end;',
      '%mend f;',
      ''
    ].join('\n')
    const expectedMacro = [
      '%macro f();',
      '  %if &type=N %then %do;',
      '    &valn',
      '  %end;',
      '  %else %if &type=C %then %do;',
      '    &valc',
      '  %end;',
      '%mend f;',
      ''
    ].join('\n')
    const formattedMacro = await request(app)
      .post('/SASjsApi/code/format')
      .send({ code: macro })
      .expect(200)
    assert.equal(formattedMacro.body, expectedMacro)
    const formattedMacroAgain = await request(app)
      .post('/SASjsApi/code/format')
      .send({ code: formattedMacro.body })
      .expect(200)
    assert.equal(formattedMacroAgain.body, expectedMacro)

    // Marked macro delimiters can make the remainder unsafe to parse: preserve
    // the following data records and produce the same text on a second pass.
    for (const source of [
      '%let z=%bquote(%();\n%put TAIL;\n',
      '%let z=%nrbquote(%));\n%put TAIL;\n',
      '%let z=%bquote(%();\ndata w;\ninput x $;\ndatalines;\nrun;   DATA\n;\nrun;\n'
    ]) {
      const first = await request(app)
        .post('/SASjsApi/code/format')
        .send({ code: source, layout: true })
        .expect(200)
      assert.equal(first.body, source, 'marked delimiter and suffix must survive')
      const second = await request(app)
        .post('/SASjsApi/code/format')
        .send({ code: first.body, layout: true })
        .expect(200)
      assert.equal(second.body, first.body, 'formatting must be idempotent')
    }

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
    // `layout: false` is the editor's "fix lint issues": the rules run, the
    // engine does not. The statement stays on the line the author wrote it on,
    // because re-breaking it is the engine's job and nobody asked for it.
    const rulesOnly = await request(app)
      .post('/SASjsApi/code/format')
      .send({ code: 'data _null_;x=1;   \nrun;\n', layout: false })
      .expect(200)
    assert.ok(
      rulesOnly.body.includes('data _null_;x=1;\n'),
      `layout: false must not re-break statements, got ${JSON.stringify(rulesOnly.body)}`
    )
    assert.ok(
      !rulesOnly.body.includes('x=1;   '),
      'layout: false must still apply the rules that can be fixed'
    )

    const layout = await request(app)
      .post('/SASjsApi/code/format')
      .send({ code: 'data _null_;x=1;   \nrun;\n' })
      .expect(200)
    assert.ok(
      layout.body.includes('data _null_;\n  x=1;\n'),
      `the default must lay the statement out, got ${JSON.stringify(layout.body)}`
    )

    console.log(
      'Real format API preserves standalone macro calls and header indentation; formatting is idempotent; layout: false applies the rules alone'
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
