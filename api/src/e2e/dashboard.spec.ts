/**
 * Browser test of the landing page and the Apps tab.
 *
 * Three things a unit test cannot see:
 *
 *   - the Apps tab is where apps live now, and the home page says who you are
 *     and what you were doing rather than listing everything;
 *   - opening an app and opening a file are recorded, so the dashboard knows
 *     about them on return - the wiring, not just the rendering;
 *   - the tab underline follows the route. It fell back to Home on /SASjsDocs
 *     because the header's list of tabbed routes did not include it, which looked
 *     to a reader like a broken tab rather than a missing entry.
 *
 * Navigation here is mostly by URL with the underline asserted, rather than by
 * clicking every tab: the underline is what the bug was, and a click on a tab
 * whose label MUI renders in capitals is a locator question that says nothing
 * about the behaviour. One tab is clicked for real, to prove the tab works.
 */
import path from 'path'
import { mkdirSync } from 'fs'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { Browser, Page, chromium } from 'playwright'
import { createFile, fileExists } from '@sasjs/utils'
import { getWebBuildFolder, sysInitCompiledPath } from '../utils/'
import { UserController } from '../controllers/'

const screenshotDir =
  process.env.E2E_SCREENSHOT_DIR ?? path.join(__dirname, 'screenshots')

const user = {
  displayName: 'Dashboard User',
  // Lowercase alphanumeric, at most 16 characters (usernameSchema).
  username: 'dashuser',
  password: '87654321',
  isAdmin: true,
  isActive: true
}

const NEW_PASSWORD = 'newpass123'

describe('Home dashboard and Apps tab', () => {
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

    if (!(await fileExists(path.join(getWebBuildFolder(), 'index.bundle.js'))))
      throw new Error(
        `No web build at ${getWebBuildFolder()}. Run \`npm run build\` in web/ before the browser test.`
      )

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

  /**
   * The label of the selected tab, lowercased: MUI renders tab text in capitals,
   * so the comparison is on the word rather than on the styling.
   */
  const selectedTab = async (page: Page): Promise<string> =>
    (
      await page
        .locator('[role="tab"][aria-selected="true"]')
        .first()
        .innerText()
    )
      .trim()
      .toLowerCase()

  it('lands on a dashboard, records what was opened, and clears it', async () => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 }
    })
    const page = await context.newPage()

    await page.goto(baseUrl())
    await page.waitForSelector('#username', { timeout: 30000 })
    await page.fill('#username', user.username)
    await page.fill('#password', user.password)
    await page.click('form button[type="submit"]')

    // First sign-in sets a new password.
    await page.waitForSelector('text=STUDIO', { timeout: 30000 })
    await page.getByLabel('Current Password').fill(user.password)
    await page.getByLabel('New Password').fill(NEW_PASSWORD)
    await page.click('form button[type="submit"]')

    // The landing page is the dashboard: a welcome, and two empty lists that
    // say what would fill them.
    await page.waitForSelector(`text=Welcome, ${user.displayName}`, {
      timeout: 30000
    })
    expect(await selectedTab(page)).toBe('home')
    expect(await page.getByText('Apps you open appear here.').count()).toBe(1)
    expect(
      await page.getByText('Files you open in Studio appear here.').count()
    ).toBe(1)

    // Apps live on their own tab now - clicked, not navigated to, so the tab is
    // known to work.
    await page.click('[role="tablist"] a[href="/SASjsApps"]')
    await page.waitForSelector('text=Run ad hoc code', { timeout: 30000 })
    expect(await selectedTab(page)).toBe('apps')
    expect(page.url()).toContain('/SASjsApps')

    // Opening an app is recorded. Studio opens a file of its own - the default
    // program - and that open is what the dashboard's file list is built from.
    await page.click('text=Run ad hoc code')
    await page.waitForSelector('text=STUDIO', { timeout: 30000 })
    await page.waitForTimeout(3000)

    await page.goto(`${baseUrl()}/`)
    await page.waitForSelector('text=Recently used apps', { timeout: 30000 })

    expect(
      await page
        .locator('a[href="/SASjsStudio"]')
        .filter({ hasText: 'Studio' })
        .count()
    ).toBeGreaterThan(0)
    expect(await page.getByText(/\/home\/dashuser\/program\.sas/).count()).toBe(
      1
    )

    await page.screenshot({ path: path.join(screenshotDir, 'dashboard.png') })

    // The Docs tab keeps its own underline: the header lists tabbed routes, and
    // a route missing from that list showed Home as selected instead.
    await page.goto(`${baseUrl()}/SASjsDocs`)
    await page.waitForTimeout(1500)
    expect(await selectedTab(page)).toBe('docs')

    // Clearing the history empties both lists.
    await page.goto(`${baseUrl()}/`)
    await page.waitForSelector('text=Recently used apps', { timeout: 30000 })
    await page
      .getByRole('button', { name: "Clear this browser's dashboard history" })
      .click()

    await page.waitForSelector('text=Apps you open appear here.', {
      timeout: 30000
    })
    expect(
      await page.getByText('Files you open in Studio appear here.').count()
    ).toBe(1)

    await context.close()
  }, 180000)

  it('describes a browser host when the page says it is one', async () => {
    // A browser host states what it is in the document it builds - the mock
    // site's loader injects `<meta name="sasjs-host" content="browser">`. The
    // server does not, so the page says it is talking to the server. Here the
    // document is served as a browser host would serve it, which is the whole
    // difference the intro has to explain.
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 }
    })

    await context.route(`${baseUrl()}/`, async (route) => {
      const response = await route.fetch()
      const html = await response.text()

      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: html.replace(
          '</head>',
          '<meta name="sasjs-host" content="browser" /></head>'
        )
      })
    })

    const page = await context.newPage()

    await page.goto(baseUrl())
    await page.waitForSelector('#username', { timeout: 30000 })
    await page.fill('#username', user.username)
    await page.fill('#password', NEW_PASSWORD)
    await page.click('form button[type="submit"]')

    await page.waitForSelector('text=running in this browser', {
      timeout: 30000
    })

    expect(await page.getByText('The server process').count()).toBe(0)
    expect(await page.getByText('A service worker in this page').count()).toBe(
      1
    )

    await page.screenshot({
      path: path.join(screenshotDir, 'dashboard-browser-host.png')
    })
    await context.close()
  }, 120000)

  it('says it is talking to the server when the page carries no such statement', async () => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 }
    })
    const page = await context.newPage()

    await page.goto(baseUrl())
    await page.waitForSelector('#username', { timeout: 30000 })
    await page.fill('#username', user.username)
    await page.fill('#password', NEW_PASSWORD)
    await page.click('form button[type="submit"]')

    await page.waitForSelector('text=You are talking to', { timeout: 30000 })

    expect(
      await page.getByText('The server process', { exact: true }).count()
    ).toBe(1)

    await context.close()
  }, 120000)
})
