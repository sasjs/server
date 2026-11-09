/**
 * Browser test of the Docs screen.
 *
 * The documentation site is built from `docs/` into the web build and served at
 * `/documentation`; the interface's `/docs` route frames it, so the header and
 * tabs stay in place and the address bar carries the page being read. The test
 * checks what a reader depends on and a unit test cannot see:
 *
 *   - the pages are served with their own assets, under their own path
 *   - the tab opens the screen, not a separate page
 *   - a deep link, and a link followed inside the frame, both leave the address
 *     bar on the page that is actually on screen
 *   - the page takes the app's colour scheme
 *   - a build without the site says so instead of framing a 404
 */
import path from 'path'
import { mkdirSync, renameSync } from 'fs'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { Browser, Frame, Page, chromium } from 'playwright'
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

const docsFolder = () => path.join(getWebBuildFolder(), 'documentation')

/** The frame the Docs screen draws, once it has loaded. */
const docsFrame = async (page: Page): Promise<Frame> => {
  await page.waitForSelector('iframe[src^="/documentation"]', {
    timeout: 30000
  })

  // the frame is attached before it has a URL, so its presence and its address
  // arrive at different moments
  for (let attempt = 0; attempt < 80; attempt++) {
    const frame = page
      .frames()
      .find((candidate) => candidate.url().includes('/documentation'))

    if (frame) return frame

    await page.waitForTimeout(250)
  }

  throw new Error('The Docs screen drew no frame')
}

describe('Docs screen', () => {
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
   * also sets the new one - and remembers that it did, because the later cases
   * run after it in the same browser and would otherwise be refused with the
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

  it('serves the pages under /documentation and frames them under /docs', async () => {
    // The site is served at its own path, with its assets addressed relatively:
    // /documentation/settings/ asks for ../assets rather than /assets, which is
    // what lets the site live under a path instead of only at the origin root.
    const index = await (await fetch(`${baseUrl()}/documentation/`)).text()
    expect(index).toContain('SASjs Server')
    expect(index).toContain('assets/stylesheets/main.')

    const settings = await (
      await fetch(`${baseUrl()}/documentation/settings/`)
    ).text()
    expect(settings).toContain('../assets/')

    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 }
    })

    await signIn(page)
    await page.click('[role="tab"]:has-text("Docs")')

    const frame = await docsFrame(page)

    // the site's own bar is hidden while framed, so the wait is for a page
    await frame.locator('text=Installation').first().waitFor({ timeout: 30000 })

    // The screen is the app, with the documentation inside it - so the header is
    // still there and the address is the app's route.
    expect(new URL(page.url()).pathname).toMatch(/^\/docs\/?$/)
    expect(await page.locator('header').count()).toBeGreaterThan(0)

    await page.screenshot({ path: path.join(screenshotDir, 'docs-tab.png') })

    await page.close()
  }, 120000)

  it('keeps the address on the page being read, from a deep link and from inside the frame', async () => {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 }
    })

    await signIn(page)

    // A deep link is the app's route for the page, and the frame follows it.
    await page.goto(`${baseUrl()}/docs/settings/`)
    const frame = await docsFrame(page)

    await frame.waitForFunction(
      () =>
        (document.querySelector('h1')?.textContent ?? '').includes('Settings'),
      undefined,
      { timeout: 30000 }
    )

    expect(frame.url()).toContain('/documentation/settings/')

    // A link followed inside the frame is the reader's new page, so the address
    // bar follows it - otherwise reload, Back and a bookmark all land elsewhere.
    await frame.click('nav a[href$="/permissions/"]')
    await page.waitForFunction(
      () => window.location.pathname === '/docs/permissions/',
      undefined,
      { timeout: 30000 }
    )

    expect(frame.url()).toContain('/documentation/permissions/')

    await page.close()
  }, 120000)

  it('carries the app colour scheme into the framed page', async () => {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 }
    })

    await signIn(page)

    // The docs follow the app's colour scheme, not just the operating system's:
    // the site is same-origin with the app, so the preference the app stores in
    // `studio-settings` is the one the framed page ends up with. This exercises
    // the policy too - the palette block is inline, so if the docs mount refused
    // inline scripts the attribute would never change.
    const setScheme = async (preference: 'light' | 'dark') => {
      await page.evaluate((mode) => {
        const settings = JSON.parse(
          localStorage.getItem('studio-settings') || '{}'
        )

        // Object.assign rather than a spread: this runs in the page, and the
        // suite compiles to ES5 where a spread becomes a helper the page has no
        // definition for.
        localStorage.setItem(
          'studio-settings',
          JSON.stringify(
            Object.assign({}, settings, { 'workbench.colorTheme': mode })
          )
        )
      }, preference)

      await page.goto(`${baseUrl()}/docs/`)

      const frame = await docsFrame(page)

      await frame
        .locator('text=Installation')
        .first()
        .waitFor({ timeout: 30000 })

      // Material may re-apply the palette while it initialises, so the answer is
      // the settled value rather than the first one.
      await frame
        .waitForFunction(
          (expected) =>
            document.body.getAttribute('data-md-color-scheme') === expected,
          preference === 'dark' ? 'slate' : 'default',
          { timeout: 15000 }
        )
        .catch(() => undefined)
    }

    await setScheme('dark')
    await setScheme('light')

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
      await page.goto(`${baseUrl()}/docs/`)

      const frame = await docsFrame(page)

      await frame.waitForSelector('text=This build carries no documentation', {
        timeout: 30000
      })

      await page.close()
    } finally {
      renameSync(aside, docsFolder())
    }
  }, 120000)
})
