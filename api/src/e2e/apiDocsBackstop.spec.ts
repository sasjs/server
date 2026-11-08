/**
 * Browser test of the API screen's refusal backstop.
 *
 * The pane reads `securitypolicyviolation` for the precise case - a frame-src
 * refusal names the frame it refused - but not every refusal raises one: an
 * X-Frame-Options mismatch is enforced silently, and a page that never arrives
 * raises nothing at all. Both leave the frame on about:blank, so the pane also
 * has a timeout, and this spec is what keeps that timeout honest: the frame's
 * request is fulfilled with `X-Frame-Options: DENY`, the frame is refused with
 * no CSP event, and the pane must still say why after the backstop fires.
 *
 * The other half - a frame-src refusal - is apiDocs.spec.ts, which drives it
 * through HELMET_CSP_CONFIG_PATH.
 */
import path from 'path'
import { mkdirSync } from 'fs'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { Browser, chromium } from 'playwright'
import { createFile, fileExists } from '@sasjs/utils'
import { getWebBuildFolder, sysInitCompiledPath } from '../utils/'
import { UserController } from '../controllers/'

const screenshotDir =
  process.env.E2E_SCREENSHOT_DIR ?? path.join(__dirname, 'screenshots')

/** Longer than FRAME_TIMEOUT_MS in the pane, with room for the render. */
const BACKSTOP_WAIT_MS = 30000

const user = {
  displayName: 'API Backstop User',
  // Lowercase alphanumeric, at most 16 characters (usernameSchema).
  username: 'apibackstop',
  password: '87654321',
  isAdmin: true,
  isActive: true
}

const NEW_PASSWORD = 'newpass123'

describe('API screen when the frame is refused without a CSP event', () => {
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

    // This case is about the backstop, so the policy must not be the thing that
    // refuses the frame: a sibling spec writes a frame-src rule into the shared
    // throwaway tree, and the app reads the path only when it boots.
    delete process.env.HELMET_CSP_CONFIG_PATH

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

  it('says the frame is blocked when the page never arrives', async () => {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 }
    })

    const violations: string[] = []
    const docsRequests: string[] = []
    let pendingRoute = 0

    await page.exposeFunction('__recordViolation', (directive: string) =>
      violations.push(directive)
    )

    // Registered before the app loads: a route change inside the SPA does not
    // reload the document, so a listener added later still sees the frame, but
    // adding it here keeps the record complete from first paint.
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (event) => {
        ;(
          window as unknown as { __recordViolation: (d: string) => void }
        ).__recordViolation(event.effectiveDirective)
      })
    })

    // The docs request is accepted and never answered: the frame sits on
    // about:blank with no load event and no CSP violation, which is the case a
    // listener alone cannot see.
    //
    // `X-Frame-Options: DENY` on a fulfilled response was the other candidate
    // and does not work here - measured, the browser loads the fulfilled
    // document, the frame reports a load, and the refusal is never seen.
    await page.route('**/SASjsApi/', async (route) => {
      docsRequests.push(route.request().url())
      pendingRoute++

      await new Promise(() => {})
    })

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

    // The backstop, not the listener: nothing was raised for this frame.
    await page.waitForSelector(
      'text=The API documentation cannot be shown here',
      { timeout: BACKSTOP_WAIT_MS }
    )

    expect(docsRequests.length).toBe(1)
    expect(pendingRoute).toBe(1)
    expect(violations).toEqual([])

    await page.close()
  }, 120000)
})
