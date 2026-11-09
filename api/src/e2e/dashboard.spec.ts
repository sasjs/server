/**
 * Browser test of the landing page and the Apps tab.
 *
 * Three things a unit test cannot see:
 *
 *   - the Apps tab is where apps live now, and the home page says who you are
 *     and what you were doing rather than listing everything;
 *   - opening an app and opening a file are recorded, so the dashboard knows
 *     about them on return - the wiring, not just the rendering;
 *   - the tab underline follows the route. It fell back to Home on a tabbed
 *     route the header's list did not include, which looked to a reader like a
 *     broken tab rather than a missing entry.
 *
 * Navigation here is mostly by URL with the underline asserted, rather than by
 * clicking every tab: the underline is what the bug was, and a click on a tab
 * whose label MUI renders in capitals is a locator question that says nothing
 * about the behaviour. One tab is clicked for real, to prove the tab works.
 */
import path from 'path'
import { mkdirSync, writeFileSync } from 'fs'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { Browser, Page, chromium } from 'playwright'
import { requireWebBuild } from './fixture'
import { createFile, fileExists } from '@sasjs/utils'
import {
  getFilesFolder,
  getWebBuildFolder,
  sysInitCompiledPath
} from '../utils/'
import { UserController } from '../controllers/'
import { publishAppStream } from '../routes/appStream'

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

    requireWebBuild()

    mongoServer = await MongoMemoryServer.create()
    process.env.DB_CONNECT = mongoServer.getUri()

    const app = (await import('../app')).default
    con = await mongoose.connect(mongoServer.getUri())

    await new UserController().createUser(user)

    server = (await app).listen(0)
    baseUrl = () => `http://localhost:${(server.address() as any).port}`

    // One published app, so the Apps tab has something to list, toggle, open and
    // unpublish - published through the service the Admin screen calls, so the
    // registry entry and the served folder are the real pair.
    const deployment = path.join(
      getFilesFolder(),
      'Public',
      'dashdemo',
      'services',
      'web'
    )
    mkdirSync(deployment, { recursive: true })
    writeFileSync(
      path.join(deployment, 'index.html'),
      '<!doctype html><title>Dashdemo</title><h1>Dashdemo</h1>'
    )
    await publishAppStream('/Public/dashdemo', 'web', 'Dashdemo')

    browser = await chromium.launch(
      process.env.CHROMIUM_PATH
        ? { executablePath: process.env.CHROMIUM_PATH }
        : {}
    )
  }, 120000)

  afterAll(async () => {
    process.appStreamConfig = {}
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
    // known to work. It lists published apps and nothing else: Studio and the
    // API explorer are header tabs on every screen.
    await page.click('[role="tablist"] a[href="/apps"]')
    // The tile's anchor is the visible target; the title inside it is a
    // zero-width-safe Typography that Playwright reports as hidden.
    const appTile = page.locator('a[href="/app/Dashdemo/"]')
    const appRow = page.locator('.MuiListItemButton-root', {
      hasText: 'Dashdemo'
    })

    await appTile.first().waitFor({ timeout: 30000 })
    expect(await selectedTab(page)).toBe('apps')
    expect(page.url()).toContain('/apps')
    expect(await page.getByText('Run ad hoc code').count()).toBe(0)

    // Two views of the same list, and the choice is remembered. A tile is a
    // Paper inside the app's link; a list row is not, so the paper's presence is
    // what tells the two apart.
    const tiles = page.locator('a[href="/app/Dashdemo/"] .MuiPaper-root')

    await page.getByRole('button', { name: 'List view' }).click()
    await appRow.first().waitFor({ timeout: 30000 })
    expect(await tiles.count()).toBe(0)

    await page.reload()
    await appRow.first().waitFor({ timeout: 30000 })
    expect(await tiles.count()).toBe(0)

    await page.screenshot({
      path: path.join(screenshotDir, 'apps-list.png')
    })

    // The row states the server's publish date, which is the registry's own
    // record rather than this browser's first sight of the app.
    // The locale decides whether the day or the month comes first, so the date's
    // shape is asserted, not its order.
    expect(
      await page
        .getByText(
          /published (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d)/
        )
        .count()
    ).toBeGreaterThan(0)

    // The bin on the row unpublishes, and the dialog says what it leaves alone.
    await page
      .getByRole('button', { name: 'Unpublish Dashdemo', exact: true })
      .click()
    await page.waitForSelector('text=Unpublish Dashdemo?', { timeout: 30000 })
    expect(await page.getByText(/stay in the drive/).count()).toBe(1)
    await page.getByRole('button', { name: 'Unpublish', exact: true }).click()
    await page.waitForSelector('text=No apps are published', { timeout: 30000 })

    // Publishing it again brings it back, because the files were never the
    // registry entry.
    await publishAppStream('/Public/dashdemo', 'web', 'Dashdemo')
    await page.reload()
    await appRow.first().waitFor({ timeout: 30000 })

    await page.getByRole('button', { name: 'Grid view' }).click()
    await tiles.first().waitFor({ timeout: 30000 })

    // Opening an app is recorded. A row opens a tab, as a tile does.
    const popupPromise = context.waitForEvent('page')
    await appTile.first().click()
    const popup = await popupPromise
    await popup.waitForLoadState('domcontentloaded')
    expect(popup.url()).toContain('/app/Dashdemo/')
    await popup.close()

    // A file opened in Studio is recorded the same way; the Studio tab in the
    // header is the path to it now.
    await page.goto(`${baseUrl()}/studio`)
    await page.waitForSelector('text=STUDIO', { timeout: 30000 })
    await page.waitForTimeout(3000)

    await page.goto(`${baseUrl()}/`)
    await page.waitForSelector('text=Recently used apps', { timeout: 30000 })

    expect(await page.getByText('Dashdemo').count()).toBeGreaterThan(0)
    expect(await page.getByText(/\/home\/dashuser\/program\.sas/).count()).toBe(
      1
    )

    await page.screenshot({ path: path.join(screenshotDir, 'dashboard.png') })

    // The Docs and API tabs are links to pages the server serves, not screens of
    // the app, so there is no underline to assert: the target is what has to be
    // right.
    expect(await page.locator('[role="tablist"] a[href="/docs"]').count()).toBe(
      1
    )
    expect(await page.locator('[role="tablist"] a[href="/api"]').count()).toBe(
      1
    )

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
