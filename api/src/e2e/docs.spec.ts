/**
 * Browser test of the Docs tab.
 *
 * The documentation site is built from `docs/` and copied into the web build,
 * which the server serves at `/docs`; the tab is a link to that path. The test
 * therefore checks three things a reader depends on and a unit test cannot see:
 * the site is served with its own assets under that path, the tab opens it, and
 * a build without the site says so instead of answering with the interface's
 * 404.
 *
 * The second case renames the built site out of the way for the duration of one
 * page load, which is what a checkout that skipped `npm run docs:build` looks
 * like from the server's side.
 */
import path from 'path'
import { mkdirSync, renameSync } from 'fs'
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
  displayName: 'Docs Screen User',
  // Lowercase alphanumeric, at most 16 characters (usernameSchema).
  username: 'docsscreen',
  password: '87654321',
  isAdmin: true,
  isActive: true
}

const NEW_PASSWORD = 'newpass123'

const docsFolder = () => path.join(getWebBuildFolder(), 'docs')

describe('Docs tab', () => {
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

    if (!(await fileExists(path.join(docsFolder(), 'index.html')))) {
      throw new Error(
        `No docs build at ${docsFolder()}. Run \`npm run docs:build\` (needs docs/requirements.txt) before the browser test.`
      )
    }

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
   * Sign in and land on the app's home screen.
   *
   * The user schema forces a password change on first sign-in, so the first call
   * also sets the new one - and remembers that it did, because the second case
   * runs after it in the same browser and would otherwise be refused with the
   * password that no longer works.
   */
  let passwordChanged = false

  const signIn = async (page: Page) => {
    await page.goto(baseUrl())
    await page.waitForSelector('#username', { timeout: 30000 })
    await page.fill('#username', user.username)
    await page.fill('#password', passwordChanged ? NEW_PASSWORD : user.password)
    await page.click('form button[type="submit"]')

    if (!passwordChanged) {
      await page.waitForSelector('text=STUDIO', { timeout: 30000 })
      await page.getByLabel('Current Password').fill(user.password)
      await page.getByLabel('New Password').fill(NEW_PASSWORD)
      await page.click('form button[type="submit"]')
      passwordChanged = true
    }

    await page.waitForSelector('text=STUDIO', { timeout: 30000 })
  }

  it('serves the site under /docs and the tab opens it', async () => {
    // The site is served at the short path, and its assets are addressed
    // relatively: the site's own pages sit one level up from the mount, so
    // /docs/settings/ asks for ../assets rather than /assets - which is what
    // makes it work under the mount instead of only at the origin root.
    const index = await (await fetch(`${baseUrl()}/docs/`)).text()
    expect(index).toContain('SASjs Server')
    expect(index).toContain('assets/stylesheets/main.')

    const settings = await (await fetch(`${baseUrl()}/docs/settings/`)).text()
    expect(settings).toContain('../assets/')

    // The Studio page's demo video is raw HTML, which MkDocs does not rewrite -
    // so it is the one place a root-absolute src would survive the build and
    // then 404 under the mount, leaving a player that silently does not play.
    const studio = await (await fetch(`${baseUrl()}/docs/studio/`)).text()
    expect(studio).toContain('src="../img/studio-demo.webm"')
    expect(studio).toContain('src="../img/studio-demo.mp4"')

    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 }
    })

    await signIn(page)
    await page.click('[role="tab"]:has-text("Docs")')

    // The tab is a link to the site, not a screen that frames it: the page in
    // the browser is the documentation itself, with its own navigation.
    await page.locator('text=Installation').first().waitFor({ timeout: 30000 })

    expect(new URL(page.url()).pathname).toBe('/docs/')
    expect(await page.locator('iframe').count()).toBe(0)

    await page.screenshot({ path: path.join(screenshotDir, 'docs-tab.png') })

    // The site's own inline scripts are refused by the server's
    // Content-Security-Policy (`script-src 'self'`), so its palette and search
    // do not run when the pages are served by the server. That is a property of
    // the policy rather than of the path, so it is not asserted here - see the
    // note in the pull request. What this suite pins is that the tab reaches the
    // real page, from the real path.

    await page.close()
  }, 120000)

  it('says so, rather than framing a 404, when the build carries no docs', async () => {
    const aside = `${docsFolder()}.aside`
    renameSync(docsFolder(), aside)

    try {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 800 }
      })

      await signIn(page)
      await page.click('[role="tab"]:has-text("Docs")')

      await page.waitForSelector('text=This build carries no documentation', {
        timeout: 30000
      })

      await page.close()
    } finally {
      renameSync(aside, docsFolder())
    }
  }, 120000)
})
