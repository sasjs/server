/**
 * Browser test of the Studio editor.
 *
 * The rest of this suite is headless, so nothing exercised Monaco's rendering.
 * That gap let a regression reach a user as a blank page: the editor calls
 * usePrompt, whose navigation blocker threw on a react-router version without
 * `block`, and the throw unmounted the whole tree. Opening a program is
 * therefore the first thing this test does, and an uncaught exception fails it.
 *
 * The API serves the web bundle from ../web/build, so `npm run build` in web/
 * must run first. Run this with `npm run test:e2e` (jest.e2e.config.js), which
 * the unit-test run deliberately excludes.
 */
import path from 'path'
import { rm, writeFile } from 'fs/promises'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { Browser, chromium, Page } from 'playwright'
import { createFile, fileExists } from '@sasjs/utils'
import { PROGRAM_NAME, TRAILING_SPACE_LINE } from './fixture'
import { UserController } from '../controllers/'
import { RunTimeType, getWebBuildFolder, sysInitCompiledPath } from '../utils/'

// The password the user is moved to on the first-login change screen.
const NEW_PASSWORD = 'newpass123'

const screenshotDir =
  process.env.E2E_SCREENSHOT_DIR ?? path.join(__dirname, 'screenshots')

const user = {
  displayName: 'Studio E2E User',
  // Lowercase alphanumeric, at most 16 characters (usernameSchema).
  username: 'studioe2e',
  password: '87654321',
  isAdmin: true,
  isActive: true
}

describe('Studio in a browser', () => {
  let con: Mongoose
  let mongoServer: MongoMemoryServer
  let server: ReturnType<Express['listen']>
  let browser: Browser
  let page: Page
  let driveLocation: string
  const pageErrors: string[] = []

  const baseUrl = () => `http://localhost:${(server.address() as any).port}`

  beforeAll(async () => {
    // SASSessionController.createSession() reads this file before it spawns a
    // SAS process, and `npm test` does not run the script that produces it.
    if (!(await fileExists(sysInitCompiledPath))) {
      await createFile(sysInitCompiledPath, '')
    }

    if (
      !(await fileExists(path.join(getWebBuildFolder(), 'index.bundle.js')))
    ) {
      throw new Error(
        `No web build at ${getWebBuildFolder()}. Run \`npm run build\` in web/ before the browser test.`
      )
    }

    // setupEnv.ts points the working directory at a throwaway tree, so the
    // drive the app resolves under NODE_ENV=test holds this suite's fixture.
    driveLocation = process.env.DRIVE_LOCATION!

    mongoServer = await MongoMemoryServer.create()
    process.env.DB_CONNECT = mongoServer.getUri()

    const app = (await import('../app')).default
    con = await mongoose.connect(mongoServer.getUri())

    const dbUser = await new UserController().createUser(user)

    // An admin passes every route check, which keeps this test about the
    // editor rather than about the permission model.
    expect(dbUser.isAdmin).toBe(true)

    process.runTimes = [RunTimeType.JS]
    process.nodeLoc = process.execPath

    server = (await app).listen(0)

    // CI runs `npx playwright install chromium`; CHROMIUM_PATH lets a machine
    // that already has a Chromium (or cannot download one) point at it.
    browser = await chromium.launch(
      process.env.CHROMIUM_PATH
        ? { executablePath: process.env.CHROMIUM_PATH }
        : {}
    )
    page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    page.on('pageerror', (error) => pageErrors.push(String(error)))

    // Log in.
    await page.goto(baseUrl())
    await page.waitForSelector('input[type="password"]', { timeout: 30000 })
    await page.fill('input[type="text"]', user.username)
    await page.fill('input[type="password"]', user.password)
    await page.click('button[type="submit"]')

    // The user schema defaults needsToUpdatePassword to true, so a newly
    // created user lands on the change-password screen before anything else.
    await page.getByLabel('Current Password').fill(user.password)
    await page.getByLabel('New Password').fill(NEW_PASSWORD)
    await page.click('button[type="submit"]')

    // The Studio tab appears once the session is established and the granted
    // routes have arrived. Navigating to Studio before that point races the
    // login: the sign-in handler settles on the home route, discarding the hash.
    await page.waitForSelector('text=STUDIO', { timeout: 30000 })

    // Studio, then the program. The tab is clicked rather than navigating by
    // hash: a same-document hash change does not render the Studio route.
    await page.click('[role="tab"]:has-text("STUDIO")')
    await page.waitForSelector('.monaco-editor', { timeout: 30000 })
    await page.click(`text=${PROGRAM_NAME}`)
    await page.waitForFunction(
      () => document.querySelectorAll('.view-lines .view-line').length > 10,
      { timeout: 30000 }
    )
    await page.waitForTimeout(1500)
  }, 120000)

  afterAll(async () => {
    await browser?.close()
    server?.close()
    await con?.connection.dropDatabase()
    await con?.connection.close()
    await mongoServer?.stop()
    await rm(path.dirname(path.dirname(driveLocation)), {
      recursive: true,
      force: true
    })
  })

  it('opens a program without unmounting the app', async () => {
    expect(pageErrors).toEqual([])

    const mounted = await page.evaluate(
      () => document.getElementById('root')?.childElementCount ?? 0
    )
    expect(mounted).toBeGreaterThan(0)

    await page.screenshot({
      path: path.join(screenshotDir, '01-highlighting.png')
    })
  }, 60000)

  it('colours SAS tokens', async () => {
    // Asserted on the computed colour rather than the token class: a token
    // whose type the themes do not colour still gets a class of its own, so a
    // class comparison passes while the editor renders it as plain text.
    const tokens = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.view-lines .view-line')).flatMap(
        (line) =>
          Array.from(line.querySelectorAll('span > span'))
            .filter((span) => span.textContent && span.textContent.trim())
            .map((span) => ({
              text: span.textContent!,
              colour: getComputedStyle(span).color
            }))
      )
    )

    const colourOf = (text: string) =>
      tokens.find((token) => token.text.trim() === text)?.colour

    const keyword = colourOf('data')
    const func = colourOf('sum')
    const format = colourOf('comma10.2')
    const variable = colourOf('x')
    const comment = tokens.find((token) =>
      token.text.includes('@brief')
    )?.colour

    // Every role must be distinguishable in what is rendered.
    expect(
      new Set(tokens.map((token) => token.colour)).size
    ).toBeGreaterThanOrEqual(4)
    expect(keyword).toBeDefined()
    expect(variable).not.toEqual(keyword)
    expect(func).not.toEqual(keyword)
    expect(func).not.toEqual(variable)
    expect(format).not.toEqual(variable)
    expect(comment).not.toEqual(keyword)
  }, 60000)

  it('marks the lint finding on the offending line', async () => {
    // The squiggle is an absolutely positioned overlay rather than a child of
    // the line, so the line is found by comparing boxes.
    const result = await page.evaluate(() => {
      const squiggles = Array.from(
        document.querySelectorAll(
          '.squiggly-warning, .squiggly-error, .squiggly-info'
        )
      )
      const lines = Array.from(
        document.querySelectorAll('.view-lines .view-line')
      )

      const marked = squiggles.map((squiggle) => {
        const box = squiggle.getBoundingClientRect()
        const index = lines.findIndex((line) => {
          const lineBox = line.getBoundingClientRect()
          return lineBox.bottom > box.top + 1 && lineBox.top < box.bottom - 1
        })
        return index + 1
      })

      const lineBox = lines[marked[0] - 1]?.getBoundingClientRect()

      return {
        marked,
        clip: lineBox && {
          x: Math.max(0, lineBox.left - 40),
          y: Math.max(0, lineBox.top - 6),
          width: Math.min(1200, lineBox.width + 120),
          height: lineBox.height + 12
        }
      }
    })

    expect(result.marked).toEqual([TRAILING_SPACE_LINE])

    // A squiggle over a single trailing space is a few pixels wide, so the
    // evidence is captured through CDP, which can magnify a clip.
    const cdp = await page.context().newCDPSession(page)
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      clip: { ...result.clip!, scale: 4 }
    })
    await writeFile(
      path.join(screenshotDir, '02-lint-marker.png'),
      Buffer.from(shot.data, 'base64')
    )
  }, 60000)

  it('offers SAS completions', async () => {
    await page.click('.monaco-editor')
    await page.keyboard.press('Control+End')
    await page.keyboard.type('\nda')
    await page.keyboard.press('Control+Space')

    await page.waitForSelector('.suggest-widget .monaco-list-row', {
      timeout: 15000
    })

    const suggestions = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.suggest-widget .monaco-list-row'))
        .map((row) => (row.textContent ?? '').trim().split('\n')[0])
        .filter(Boolean)
    )

    expect(suggestions.length).toBeGreaterThan(0)
    // Each row's text is the label followed by its detail, so match on the
    // prefix rather than the whole string.
    expect(
      suggestions.some((suggestion) => suggestion.startsWith('DATA'))
    ).toBe(true)

    await page.screenshot({
      path: path.join(screenshotDir, '03-completions.png')
    })
  }, 60000)
})
