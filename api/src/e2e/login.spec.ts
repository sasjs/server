/**
 * Browser test of the sign-in screen.
 *
 * The rest of this suite drives the Studio, and reaches the login form only as
 * a step on the way in - so nothing asserted that the screen is readable, that
 * a refusal is shown, or that a stale CSRF token does not lock the browser out
 * of the server for good. Each of those has reached a user: a login screen
 * whose input boxes all but vanished in dark mode, and a jar holding an
 * XSRF-TOKEN from an earlier deployment, where every Submit was refused with
 * `Invalid CSRF token!` and no amount of retrying recovered it.
 *
 * The contrast cases are the accessibility check this screen has never had:
 * WCAG 1.4.11 asks 3:1 of a control's boundary and 1.4.3 asks 4.5:1 of a
 * label, measured against the page background the screen actually draws.
 *
 * The API serves the web bundle from ../web/build, so `npm run build` in web/
 * must run first. Run this with `npm run test:e2e`, which the unit-test run
 * deliberately excludes.
 */
import path from 'path'
import { mkdirSync } from 'fs'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { Browser, BrowserContext, chromium, Page } from 'playwright'
import { createFile, fileExists } from '@sasjs/utils'
import { getWebBuildFolder, sysInitCompiledPath } from '../utils/'

const screenshotDir =
  process.env.E2E_SCREENSHOT_DIR ?? path.join(__dirname, 'screenshots')

/** A username that cannot exist, so the server's refusal is the fixture. */
const UNKNOWN_USER = 'nosuchuser'
const ANY_PASSWORD = 'wrongpassword'

/** The refusal the CSRF middleware sends, and the one that must not survive. */
const CSRF_REFUSAL = 'Invalid CSRF token!'

type Rgba = { r: number; g: number; b: number; a: number }

/** A computed colour, as the browser reports it (`rgb()` or `rgba()`). */
const parseColor = (value: string): Rgba => {
  const match = value.match(/rgba?\(([^)]+)\)/)

  if (!match) throw new Error(`Unreadable colour: ${value}`)

  const parts = match[1].split(',').map((part) => parseFloat(part))

  return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 }
}

/** `fg` composited over `bg`, which is what the eye is given. */
const composite = (fg: Rgba, bg: Rgba): Rgba => ({
  r: fg.r * fg.a + bg.r * (1 - fg.a),
  g: fg.g * fg.a + bg.g * (1 - fg.a),
  b: fg.b * fg.a + bg.b * (1 - fg.a),
  a: 1
})

const channel = (value: number): number => {
  const scaled = value / 255

  return scaled <= 0.04045
    ? scaled / 12.92
    : Math.pow((scaled + 0.055) / 1.055, 2.4)
}

const luminance = (color: Rgba): number =>
  0.2126 * channel(color.r) +
  0.7152 * channel(color.g) +
  0.0722 * channel(color.b)

/** WCAG contrast ratio between two opaque colours. */
const contrastRatio = (a: Rgba, b: Rgba): number => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)

  return (high + 0.05) / (low + 0.05)
}

/**
 * The colours the screen actually uses for one field: the label, the box
 * outline, and the page background behind both.
 *
 * `borderTopColor` is read from the fieldset MUI draws the outline with; it is
 * usually semi-transparent, so it is composited over the background before it
 * is measured - the ratio that matters is the one the eye is given.
 */
const readFieldColours = (page: Page, id: string) =>
  page.evaluate((fieldId: string) => {
    const input = document.querySelector(`#${fieldId}`) as HTMLElement
    const label = document.querySelector(
      `label[for="${fieldId}"]`
    ) as HTMLElement
    const fieldset = input
      .closest('.MuiOutlinedInput-root')!
      .querySelector('fieldset') as HTMLElement

    const style = (element: HTMLElement) => getComputedStyle(element)

    return {
      label: style(label).color,
      outline: style(fieldset).borderTopColor,
      background: style(document.body).backgroundColor
    }
  }, id)

const measuredField = async (page: Page, id: string) => {
  const colours = await readFieldColours(page, id)
  const background = parseColor(colours.background)
  const label = parseColor(colours.label)
  const outline = composite(parseColor(colours.outline), background)

  return {
    colours,
    labelRatio: contrastRatio(label, background),
    outlineRatio: contrastRatio(outline, background)
  }
}

describe('Sign-in screen in a browser', () => {
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  let server: ReturnType<Express['listen']>
  let browser: Browser
  let context: BrowserContext
  let page: Page

  const baseUrl = () => `http://localhost:${(server.address() as any).port}`

  /** The server's answer as it appears on the screen, not as it leaves the API. */
  const formText = () =>
    page.evaluate(() =>
      (document.querySelector('form')?.innerText ?? '').replace(/\s+/g, ' ')
    )

  beforeAll(async () => {
    // The server reads this file before it spawns a SAS process, and the suite
    // does not run the script that produces it.
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

    mongoServer = await MongoMemoryServer.create()
    process.env.DB_CONNECT = mongoServer.getUri()

    const app = (await import('../app')).default
    con = await mongoose.connect(mongoServer.getUri())

    server = (await app).listen(0)

    browser = await chromium.launch(
      process.env.CHROMIUM_PATH
        ? { executablePath: process.env.CHROMIUM_PATH }
        : {}
    )
  }, 120000)

  beforeEach(async () => {
    // A fresh context per case: the stale-token case changes the cookie jar,
    // and a shared one would leak that state into the cases after it.
    context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    })
    page = await context.newPage()
  })

  afterEach(async () => {
    await context?.close()
  })

  afterAll(async () => {
    await browser?.close()
    server?.close()
    await con?.connection.dropDatabase()
    await con?.connection.close()
    await mongoServer?.stop()
  }, 60000)

  it('offers a usable form, readable in both colour schemes', async () => {
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme })
      await page.goto(baseUrl())
      await page.waitForSelector('#username', { timeout: 30000 })

      // Present, and able to submit. A disabled Submit is how this screen fails
      // when the app context has no setter to hand: it is visible, it does
      // nothing, and nothing on the page says why.
      expect(await page.locator('#username').isVisible()).toBe(true)
      expect(await page.locator('#password').isVisible()).toBe(true)
      expect(await page.locator('form button[type="submit"]').isEnabled()).toBe(
        true
      )

      const username = await measuredField(page, 'username')

      // 3:1 for the boundary of a control, 4.5:1 for its label (WCAG 1.4.11,
      // 1.4.3). Measured off the rendered page, so a palette change that makes
      // the box disappear in one scheme fails here rather than at the user.
      expect({
        scheme: colorScheme,
        outlineAtLeast3: username.outlineRatio >= 3,
        labelAtLeast4_5: username.labelRatio >= 4.5
      }).toEqual({
        scheme: colorScheme,
        outlineAtLeast3: true,
        labelAtLeast4_5: true
      })
    }
  }, 120000)

  it('names the build it came from, on the login screen', async () => {
    await page.goto(baseUrl())
    await page.waitForSelector('footer', { timeout: 30000 })

    // The stamp a support request starts from: the version of the server that
    // served this screen is readable before anyone signs in.
    const stamp = (await page.locator('footer').innerText()).trim()

    expect(stamp.length).toBeGreaterThan(0)
    expect(stamp).toMatch(/\(/)
  }, 120000)

  it('shows the server refusal when the credentials are refused', async () => {
    await page.goto(baseUrl())
    await page.waitForSelector('#username', { timeout: 30000 })

    await page.fill('#username', UNKNOWN_USER)
    await page.fill('#password', ANY_PASSWORD)
    await page.click('form button[type="submit"]')

    // The screen must say what the server said. Silence here is the failure a
    // user cannot act on: the form stays, the spinner stops, nothing is said.
    await page.waitForFunction(
      () =>
        !!(document.querySelector('form') as HTMLElement)?.innerText?.includes(
          'not found'
        ),
      { timeout: 30000 }
    )

    expect(await formText()).toContain('Username is not found.')
    expect(await page.locator('#username').isVisible()).toBe(true)
  }, 120000)

  it('signs in on the first attempt when the CSRF token is stale', async () => {
    await page.goto(baseUrl())
    await page.waitForSelector('#username', { timeout: 30000 })

    // What a browser carries after an upgrade left a token behind: the cookie
    // no longer verifies against the session, and the server refuses every
    // state-changing request that echoes it.
    await context.addCookies([
      { name: 'XSRF-TOKEN', value: 'stale-token', url: baseUrl() }
    ])

    await page.fill('#username', UNKNOWN_USER)
    await page.fill('#password', ANY_PASSWORD)
    await page.click('form button[type="submit"]')

    // ONE press. The refusal re-issues a token, and the client retries with it,
    // so the answer on screen is the server's verdict on the credentials - not
    // the CSRF refusal, which is what a user of #304 saw every time.
    await page.waitForFunction(
      () =>
        !!(document.querySelector('form') as HTMLElement)?.innerText?.includes(
          'not found'
        ),
      { timeout: 30000 }
    )

    expect(await formText()).not.toContain(CSRF_REFUSAL)
    expect(await formText()).toContain('Username is not found.')
  }, 120000)
})
