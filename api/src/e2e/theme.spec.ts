/**
 * Browser tests for the things a unit test cannot see: the colour scheme the
 * page paints before the bundle loads, and how much code a route downloads.
 *
 * Both exist because of real regressions, and both were invisible to every test
 * the repository had at the time.
 *
 * The theme boot once read a localStorage key the application never wrote, so the
 * document was painted from the operating system's preference while the interface
 * rendered from the user's own choice. Nothing failed: the page was simply dark in
 * one half and light in the other, which is a rendering fact and needs a browser
 * to observe. The assertion is therefore not "the background is #121212" but "the
 * document and the interface agree" - the property that was broken.
 *
 * The editor was in the bundle every route loaded, which put ~5 MB on the home,
 * Apps and Settings screens. Those are now lazy, and the only honest guard is to
 * measure what a route actually downloads.
 */
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { Browser, BrowserContext, Page, chromium } from 'playwright'
import { requireWebBuild } from './fixture'

/** The key the application stores its settings under (SETTINGS_STORAGE_KEY). */
const SETTINGS_KEY = 'studio-settings'

const themeSetting = (preference: 'light' | 'dark' | 'system') =>
  JSON.stringify({ 'workbench.colorTheme': preference })

/**
 * How light a painted background is, 0 (black) to 1 (white), or null when the
 * element paints nothing at all.
 *
 * A comparison of exact colours would pin the palette, which is a theme decision
 * rather than a correctness one; what matters is whether the two halves of the
 * page are in the same scheme.
 *
 * The null is the point. A transparent background parses as `rgba(0, 0, 0, 0)`,
 * whose colour components are all zero - so a naive luminance of it is 0, which
 * every "dark" assertion below would accept. "Painted nothing" must not be able to
 * satisfy "painted dark", so alpha is read and a missing or invisible element
 * returns null for the caller to fail on.
 */
const luminanceOf = async (
  page: Page,
  selector: string
): Promise<number | null> => {
  const background = await page.evaluate((sel) => {
    const element = document.querySelector(sel)

    return element ? getComputedStyle(element).backgroundColor : null
  }, selector)

  if (!background) return null

  const parts = background.match(/[\d.]+/g)

  if (!parts) return null

  const [r, g, b] = parts.map(Number)
  const alpha = parts.length > 3 ? Number(parts[3]) : 1

  if (!Number.isFinite(alpha) || alpha === 0) return null

  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255

  // A half-transparent background is composited over whatever is behind it, which
  // this cannot see; refusing it is better than reporting a colour that is not
  // the one on screen.
  return alpha < 1 ? null : luminance
}

/**
 * Fails with a message naming the element, rather than a bare comparison against
 * null that says nothing about why.
 *
 * A throw rather than `expect`, because this suite is Jest driving Playwright: its
 * `expect` takes no message argument, and a failure here should read as "the body
 * paints nothing" rather than "expected null not to be null".
 */
const expectPainted = (value: number | null, what: string): number => {
  if (value === null)
    throw new Error(
      `${what} paints no background, so its scheme cannot be read`
    )

  return value
}

describe('Colour scheme before first paint', () => {
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  let server: ReturnType<Express['listen']>
  let browser: Browser
  let baseUrl: () => string

  beforeAll(async () => {
    requireWebBuild()

    mongoServer = await MongoMemoryServer.create()
    process.env.DB_CONNECT = mongoServer.getUri()

    const app = (await import('../app')).default

    con = await mongoose.connect(mongoServer.getUri())

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
   * Loads the app with a stored preference and an OS preference, and reports what
   * was painted.
   *
   * The store is seeded before any page script runs, which is the situation the
   * theme boot is written for: it has to answer before the bundle can.
   */
  const painted = async (
    stored: 'light' | 'dark' | 'system' | null,
    osPrefersDark: boolean,
    path = '/logon'
  ) => {
    const context: BrowserContext = await browser.newContext()

    await context.addInitScript(
      ([key, value]) => {
        if (value === null) window.localStorage.removeItem(key)
        else window.localStorage.setItem(key, value)
      },
      [SETTINGS_KEY, stored === null ? null : themeSetting(stored)] as const
    )

    const page = await context.newPage()

    await page.emulateMedia({
      colorScheme: osPrefersDark ? 'dark' : 'light'
    })
    await page.goto(`${baseUrl()}${path}`, { waitUntil: 'networkidle' })

    const result = {
      document: expectPainted(await luminanceOf(page, 'html'), 'The document'),
      body: expectPainted(await luminanceOf(page, 'body'), 'The body'),
      dataScheme: await page.evaluate(() =>
        document.documentElement.getAttribute('data-color-scheme')
      )
    }

    await context.close()

    return result
  }

  it('paints dark for a dark choice, even when the OS says light', async () => {
    const result = await painted('dark', false)

    expect(result.document).toBeLessThan(0.2)
    // The regression: the document dark and the interface light, or the reverse.
    expect(result.body).toBeLessThan(0.2)
    expect(result.dataScheme).toBe('dark')
  })

  it('paints light for a light choice, even when the OS says dark', async () => {
    const result = await painted('light', true)

    expect(result.document).toBeGreaterThan(0.8)
    expect(result.body).toBeGreaterThan(0.8)
    expect(result.dataScheme).toBe('light')
  })

  it('follows the OS when the choice is system', async () => {
    const dark = await painted('system', true)
    const light = await painted('system', false)

    expect(dark.document).toBeLessThan(0.2)
    expect(dark.body).toBeLessThan(0.2)

    expect(light.document).toBeGreaterThan(0.8)
    expect(light.body).toBeGreaterThan(0.8)
  })

  it('follows the OS when nothing has been chosen', async () => {
    const result = await painted(null, true)

    expect(result.document).toBeLessThan(0.2)
    expect(result.body).toBeLessThan(0.2)
  })

  /**
   * The case the other five cannot make.
   *
   * Every assertion above reads the page once the bundle has loaded and React has
   * mounted, so what it sees is the SETTLED scheme: a boot that read nothing at
   * all would pass, because the provider paints the right colours afterwards and
   * hides the flash. This one blocks every script, so nothing but the boot runs,
   * and asserts `data-color-scheme` - the attribute the boot alone writes and no
   * other code touches.
   */
  it('paints the stored choice before any script runs', async () => {
    const context = await browser.newContext()

    await context.addInitScript(
      ([key, value]) => window.localStorage.setItem(key, value),
      [SETTINGS_KEY, themeSetting('dark')] as const
    )

    // The bundle never arrives; only the head's own script does.
    await context.route('**/*.js', (route) => {
      const url = route.request().url()

      // theme-boot.js is the file under test, so it is allowed through.
      return url.includes('theme-boot') ? route.continue() : route.abort()
    })

    const page = await context.newPage()

    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto(`${baseUrl()}/logon`, { waitUntil: 'domcontentloaded' })

    expect(
      await page.evaluate(() =>
        document.documentElement.getAttribute('data-color-scheme')
      )
    ).toBe('dark')
    expect(
      expectPainted(await luminanceOf(page, 'html'), 'The document')
    ).toBeLessThan(0.2)

    await context.close()
  })

  it('keeps the choice across a reload', async () => {
    const context = await browser.newContext()

    await context.addInitScript(
      ([key, value]) => window.localStorage.setItem(key, value),
      [SETTINGS_KEY, themeSetting('dark')] as const
    )

    const page = await context.newPage()

    // A light OS, so a dark interface can only come from the stored choice.
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto(`${baseUrl()}/logon`, { waitUntil: 'networkidle' })
    await page.reload({ waitUntil: 'networkidle' })

    expect(
      expectPainted(await luminanceOf(page, 'html'), 'The document')
    ).toBeLessThan(0.2)
    expect(
      expectPainted(await luminanceOf(page, 'body'), 'The body')
    ).toBeLessThan(0.2)

    await context.close()
  })
})

describe('What a route downloads', () => {
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  let server: ReturnType<Express['listen']>
  let browser: Browser
  let baseUrl: () => string

  beforeAll(async () => {
    requireWebBuild()

    mongoServer = await MongoMemoryServer.create()
    process.env.DB_CONNECT = mongoServer.getUri()

    const app = (await import('../app')).default

    con = await mongoose.connect(mongoServer.getUri())

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
   * The editor is a lazy route so that the screens without one stop paying for it.
   *
   * Measured rather than named: the bundle's file names carry content hashes, so a
   * test that looks for "monaco" in a URL would pass by luck and fail on a vendor
   * rename. Bytes are the property that regressed, so bytes are what is asserted -
   * the editor's own payload is several megabytes, and no screen that shows no
   * editor should come close to it.
   */
  it('does not download the editor on a screen that has none', async () => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await page.goto(`${baseUrl()}/logon`, { waitUntil: 'networkidle' })

    const scriptBytes = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .filter((entry) =>
          ['script', 'worker', 'other'].includes(
            (entry as PerformanceResourceTiming).initiatorType
          )
        )
        .reduce(
          (total, entry) =>
            total + ((entry as PerformanceResourceTiming).decodedBodySize ?? 0),
          0
        )
    )

    expect(scriptBytes).toBeLessThan(3_000_000)

    await context.close()
  }, 60000)
})
