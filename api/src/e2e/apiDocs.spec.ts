/**
 * Browser test of the API screen when the policy refuses its frame.
 *
 * The screen frames the server's own documentation page, so a policy that
 * blocks that frame leaves an empty pane with no explanation - which is what a
 * deployment reported: the title bar and the open-in-new-tab icon, and nothing
 * else, while a direct request for the page answered 200. The refusal raises
 * no failed request (the browser never sends one), so nothing in a server log
 * names it; the pane now reads the document's own `securitypolicyviolation`
 * event and says what happened.
 *
 * The policy here states `frame-src 'none'` through HELMET_CSP_CONFIG_PATH,
 * which is the operator-reachable way to refuse the frame now that a file
 * layers over the defaults rather than replacing them.
 */
import path from 'path'
import { mkdirSync, writeFileSync } from 'fs'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { Browser, chromium } from 'playwright'
import { createFile, fileExists } from '@sasjs/utils'
import { getWebBuildFolder, sysInitCompiledPath } from '../utils/'
import { UserController } from '../controllers/'

const screenshotDir =
  process.env.E2E_SCREENSHOT_DIR ?? path.join(__dirname, 'screenshots')

const user = {
  displayName: 'API Screen User',
  // Lowercase alphanumeric, at most 16 characters (usernameSchema).
  username: 'apiscreen',
  password: '87654321',
  isAdmin: true,
  isActive: true
}

const NEW_PASSWORD = 'newpass123'

describe('API screen with a policy that refuses the frame', () => {
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  let server: ReturnType<Express['listen']>
  let browser: Browser
  let baseUrl: () => string

  beforeAll(async () => {
    if (!(await fileExists(sysInitCompiledPath))) {
      await createFile(sysInitCompiledPath, '')
    }

    mkdirSync(screenshotDir, { recursive: true })

    if (
      !(await fileExists(path.join(getWebBuildFolder(), 'index.bundle.js')))
    ) {
      throw new Error(
        `No web build at ${getWebBuildFolder()}. Run \`npm run build\` in web/ before the browser test.`
      )
    }

    // Written where the app reads it: relative to the working directory, which
    // setupEnv.ts has already moved to a throwaway tree.
    writeFileSync(
      path.join(process.cwd(), 'csp.e2e.json'),
      JSON.stringify({ 'frame-src': ["'none'"] })
    )
    process.env.HELMET_CSP_CONFIG_PATH = './csp.e2e.json'

    mongoServer = await MongoMemoryServer.create()
    process.env.DB_CONNECT = mongoServer.getUri()

    const app = (await import('../app')).default
    con = await mongoose.connect(mongoServer.getUri())

    await new UserController().createUser(user)

    server = (await app).listen(0)
    baseUrl = () => `http://localhost:${(server.address() as any).port}`

    browser = await chromium.launch(
      process.env.CHROMIUM_PATH
        ? { executablePath: process.env.CHROMIUM_PATH }
        : {}
    )
  }, 120000)

  afterAll(async () => {
    await browser?.close()
    server?.close()
    await con?.connection.dropDatabase()
    await con?.connection.close()
    await mongoServer?.stop()
  }, 60000)

  it('serves the page, and says why the frame is empty', async () => {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 }
    })

    // The page itself is served, and the policy still allows the app's own
    // scripts - the merge keeps script-src when the file names only frames.
    const docs = await page.request.get(`${baseUrl()}/SASjsApi/`)
    expect(docs.status()).toBe(200)
    expect(await docs.text()).toContain('swagger-ui')

    // Sign in. The user schema defaults needsToUpdatePassword to true.
    await page.goto(baseUrl())
    await page.waitForSelector('#username', { timeout: 30000 })
    await page.fill('#username', user.username)
    await page.fill('#password', user.password)
    await page.click('form button[type="submit"]')
    await page.getByLabel('Current Password').fill(user.password)
    await page.getByLabel('New Password').fill(NEW_PASSWORD)
    await page.click('form button[type="submit"]')
    await page.waitForSelector('text=STUDIO', { timeout: 30000 })

    await page.click('[role="tab"]:has-text("API")')

    // The pane explains itself instead of drawing an empty rectangle, and
    // offers the page the policy does allow - a new tab.
    await page.waitForSelector(
      'text=The API documentation cannot be shown here',
      {
        timeout: 30000
      }
    )

    const pane = page.locator('main, body')
    const text = await pane.first().innerText()

    expect(text).toContain('Content-Security-Policy')
    expect(await page.locator('iframe').count()).toBe(0)
    // The toolbar's icon carries "Open the API documentation in a new tab" as
    // its label, so the name has to match exactly to find the pane's button.
    expect(
      await page
        .getByRole('link', { name: 'Open the API documentation', exact: true })
        .count()
    ).toBe(1)

    // The diagnosis must survive the backstop. A refused frame never fires a
    // load event, so an armed timer would replace this text with "did not load"
    // ten seconds later - and the reader here is the one who can fix the policy.
    await page.waitForTimeout(12000)

    const afterBackstop = await pane.first().innerText()

    expect(afterBackstop).toContain('Content-Security-Policy')
    expect(afterBackstop).not.toContain('did not load')

    await page.close()
  }, 120000)
})
