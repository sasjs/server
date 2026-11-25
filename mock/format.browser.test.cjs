// Exercise the built site's real service worker, drive, format route and Studio.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('../api/node_modules/playwright')
const { waitForMockReady } = require('./mock-ready.cjs')

const drivePath = '/code/macro-core/base/mf_getfilesize.sas'
const fragment =
  /  %if &format=NO %then %do;\n    &bytes\n  %end;\n  %else %do;\n    %sysfunc\(INPUTN\(&bytes, best\.\),sizekmg\.\)\n  %end;/

const crafted = fs.readFileSync(
  path.join(__dirname, 'fixtures/mf_getfilesize.sas'),
  'utf8'
)
const craftedExpected = `%macro example();
  %if &format=NO %then %do;
    &bytes
  %end;
  %else %do;
    %sysfunc(INPUTN(&bytes, best.),sizekmg.)
  %end;
%mend example;
`

async function main() {
  const url = process.env.MOCK_SITE_URL || 'http://127.0.0.1:8765/'
  const browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  })
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 }
    })
    await page.goto(new URL('/studio/', url).href)
    await page.waitForFunction(() => window.__sasjsMockReady, null, {
      timeout: 30000
    })
    await waitForMockReady(page)
    await page.reload()
    await waitForMockReady(page)
    assert.equal(
      await page.evaluate(() => !!navigator.serviceWorker.controller),
      true
    )

    const drive = await page.evaluate(async (file) => {
      const response = await fetch(
        `/SASjsApi/drive/file?_FILE=${encodeURIComponent(file)}`
      )
      return { status: response.status, text: await response.text() }
    }, drivePath)
    assert.equal(drive.status, 200, `Cannot read ${drivePath} from mock drive`)
    assert.match(drive.text, /%macro mf_getfilesize\b/)
    assert.match(drive.text, fragment)
    const cases = [
      {
        name: 'drive mf_getfilesize',
        input: drive.text
      },
      { name: 'crafted joined %end', input: crafted, expected: craftedExpected }
    ]

    const editor = page.locator('.monaco-editor').first()
    await editor.waitFor({ state: 'visible' })
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    for (const { name, input, expected } of cases) {
      await editor.click()
      await page.keyboard.press('Control+A')
      await page.evaluate((text) => navigator.clipboard.writeText(text), input)
      await page.keyboard.press('Control+V')
      let submitted = input
      for (const pass of [1, 2]) {
        const responsePromise = page.waitForResponse(
          (r) =>
            r.url().includes('/SASjsApi/code/format') &&
            r.request().method() === 'POST'
        )
        await page
          .getByRole('button', { name: /^Format: Format the layout/ })
          .click()
        const response = await responsePromise
        const payload = JSON.parse(response.request().postData())
        assert.equal(
          (payload.json || payload).code,
          submitted,
          `${name}: pass ${pass} input`
        )
        assert.equal((payload.json || payload).layout, true)
        assert.equal(response.status(), 200)
        const result = await response.json()
        assert.match(
          result,
          fragment,
          `${name}: pass ${pass} returned-value blocks`
        )
        if (expected !== undefined)
          assert.equal(
            result,
            expected,
            `${name}: pass ${pass} complete output`
          )
        if (pass === 2)
          assert.equal(result, submitted, `${name}: formatter is idempotent`)
        if (name === 'drive mf_getfilesize') {
          assert.match(result, /%macro mf_getfilesize\b/i)
          assert.match(result, /%mend\s+mf_getfilesize\s*;/i)
        }
        // The editor can virtualize lines; copying the model checks the entire
        // buffer, not only the visible lines or the route's response.
        await editor.click()
        await page.keyboard.press('Control+A')
        await page.keyboard.press('Control+C')
        assert.equal(
          await page.evaluate(() => navigator.clipboard.readText()),
          result,
          `${name}: pass ${pass} editor buffer`
        )
        submitted = result
      }
      console.log(
        `PASS: ${name}: returned-value blocks, editor rewrite and idempotence`
      )
    }
  } finally {
    await browser.close()
  }
}
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
