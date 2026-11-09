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
import { mkdirSync } from 'fs'
import { readFile, rm, writeFile } from 'fs/promises'
import { Express } from 'express'
import mongoose, { Mongoose } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { Browser, chromium, Page } from 'playwright'
import { createFile, createFolder, fileExists } from '@sasjs/utils'
import {
  INDENTED_JSON,
  INDENTED_JSON_NAME,
  JSON_FILE_NAME,
  MINIFIED_JSON,
  PROGRAM_NAME,
  SAVE_FILE_CONTENT,
  SAVE_FILE_NAME,
  TRAILING_SPACE_LINE
} from './fixture'
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
  // Every fileTree request the page makes, as the `_folderPath` it asked for -
  // or '<whole-tree>' if it asked for the entire drive in one call.
  const fileTreeRequests: string[] = []

  const baseUrl = () => `http://localhost:${(server.address() as any).port}`

  beforeAll(async () => {
    // SASSessionController.createSession() reads this file before it spawns a
    // SAS process, and `npm test` does not run the script that produces it.
    if (!(await fileExists(sysInitCompiledPath))) {
      await createFile(sysInitCompiledPath, '')
    }

    // The screenshots folder is gitignored, so a fresh checkout has no such
    // directory and a failure screenshot would fail on the write itself.
    mkdirSync(screenshotDir, { recursive: true })

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

    // A program of its own, for the tests that save what they typed.
    await createFile(
      path.join(driveLocation, 'files', SAVE_FILE_NAME),
      SAVE_FILE_CONTENT
    )

    // A JSON file kept on one line, which is how a generated config arrives.
    await createFile(
      path.join(driveLocation, 'files', JSON_FILE_NAME),
      MINIFIED_JSON
    )

    // ...and one that carries its own indent, which is not the editor's to
    // change.
    await createFile(
      path.join(driveLocation, 'files', INDENTED_JSON_NAME),
      INDENTED_JSON
    )

    // A folder that has not been opened, so the lazy load can be observed.
    await createFolder(path.join(driveLocation, 'files', 'e2eFolder'))
    await createFile(
      path.join(driveLocation, 'files', 'e2eFolder', 'nested.sas'),
      'data _null_;'
    )

    // A folder with contents, for the delete test.
    await createFolder(path.join(driveLocation, 'files', 'deleteMe', 'nested'))
    await createFile(
      path.join(driveLocation, 'files', 'deleteMe', 'nested', 'deep.sas'),
      'data _null_;'
    )

    mongoServer = await MongoMemoryServer.create()
    process.env.DB_CONNECT = mongoServer.getUri()

    const app = (await import('../app')).default
    con = await mongoose.connect(mongoServer.getUri())

    const dbUser = await new UserController().createUser(user)

    // An admin passes every route check, which keeps this test about the
    // editor rather than about the permission model.
    expect(dbUser.isAdmin).toBe(true)

    // The fixture is a .sas program, and this suite never executes code for
    // real - the log case fulfils the execute request in the browser - so one
    // runtime, the one the fixture needs, keeps the editor from switching it.
    process.runTimes = [RunTimeType.SAS]
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
    page.on('pageerror', (error) => {
      // A request the app aborts surfaces here as an unhandled rejection with
      // axios's "Canceled: Canceled". That is a request superseded by a newer one
      // - the editor re-syncing, a tab switching - not a fault in the tree, which
      // is what this collector exists to catch.
      if (String(error).includes('Canceled: Canceled')) return

      pageErrors.push(String(error))
    })
    page.on('request', (request) => {
      if (!request.url().includes('/SASjsApi/drive/fileTree')) return

      fileTreeRequests.push(
        new URL(request.url()).searchParams.get('_folderPath') ?? '<whole-tree>'
      )
    })

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

    // The landing page reads the caller's home folder for its file count, so
    // the observation starts when Studio opens - this collector is about what
    // Studio asks for, not about what the dashboard did first.
    fileTreeRequests.length = 0

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

  it('loads the drive one folder level at a time', async () => {
    // Opening Studio asked for the root level, never for the whole drive.
    // Asserted as a property of the session rather than of a fixed array, so
    // another test touching the tree cannot make this pass or fail by order.
    expect(fileTreeRequests[0]).toEqual('')
    expect(fileTreeRequests).not.toContain('<whole-tree>')

    // The nested program exists but has never been requested into the tree.
    const requestsBefore = fileTreeRequests.length

    await page.click('text=e2eFolder')
    await page.waitForSelector('text=nested.sas', { timeout: 30000 })

    // Expanding the folder asked for that folder alone, once.
    expect(fileTreeRequests.slice(requestsBefore)).toEqual(['/e2eFolder'])
  }, 60000)

  it('deletes a folder and its contents from the row context menu', async () => {
    // The label, then the row that owns it. A bare
    // '[role="treeitem"]:has-text("deleteMe")' also matches the root item,
    // which contains every name in the tree, so .first() selected the
    // whole-tree row and the right-click landed wherever that row's right edge
    // happened to be - which pointed at a different folder as soon as the tree
    // gained a row (the Studio scratch folder).
    const row = page
      .getByText('deleteMe', { exact: true })
      .first()
      .locator('xpath=ancestor::*[@role="treeitem"][1]')
    const box = await row.boundingBox()

    expect(box).not.toBeNull()

    // Right-click the ROW, well away from the label text: the menu lives on the
    // item for exactly this reason - on the label alone, a right-click anywhere
    // else in the row did nothing and the feature was invisible.
    await page.mouse.click(box!.x + box!.width - 40, box!.y + box!.height / 2, {
      button: 'right'
    })

    await page.click('[role="menuitem"]:has-text("Delete")')
    await page.waitForSelector('text=and everything under it', {
      timeout: 10000
    })
    await page.click('[role="dialog"] button:has-text("Delete")')
    await page.waitForSelector('text=Deleted!', { timeout: 20000 })
    await page.waitForTimeout(500)

    expect(
      await page.locator('[role="treeitem"]:has-text("deleteMe")').count()
    ).toBe(0)
    // and it is gone from disk, contents included
    expect(
      await fileExists(path.join(driveLocation, 'files', 'deleteMe'))
    ).toBe(false)
  }, 120000)

  it('moves the menu to the row that was right-clicked last', async () => {
    // The label, not the treeitem: ':has-text' also matches the root item,
    // which contains every name in the tree.
    const folderLabel = page.getByText('e2eFolder', { exact: true }).first()
    // Dispatched rather than clicked: an open MUI Menu renders a modal backdrop
    // that swallows the pointer, so a physical second right-click can never
    // reach the row - the state itself is what this covers.
    await folderLabel.dispatchEvent('contextmenu')
    await page.waitForSelector('[role="menuitem"]:has-text("Add Folder")')

    const fileLabel = page.getByText(PROGRAM_NAME, { exact: true }).first()
    await fileLabel.dispatchEvent('contextmenu')

    // the FILE's actions, not the folder's: keeping the previous node left the
    // menu acting on the row it was first opened for
    await page.waitForSelector(
      '[role="menuitem"]:has-text("Launch and Debug")',
      {
        timeout: 10000
      }
    )
    expect(
      await page.locator('[role="menuitem"]:has-text("Add Folder")').count()
    ).toBe(0)

    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
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

    // The element existing is not the same as the reader seeing anything:
    // Monaco's default themes leave `editorWarning.border` null, so the
    // squiggle element was in the DOM and drew nothing. Assert the underline a
    // reader is meant to see, in the colour the theme sets.
    const border = await page.evaluate(() => {
      const squiggle = document.querySelector('.squiggly-warning')

      if (!squiggle) return null

      const style = getComputedStyle(squiggle)

      return {
        style: style.borderBottomStyle,
        width: style.borderBottomWidth,
        color: style.borderBottomColor
      }
    })

    expect(border?.style).toBe('double')
    expect(border?.width).not.toBe('0px')
    expect(border?.color).not.toBe('rgba(0, 0, 0, 0)')

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

  it('lists the errors, warnings and notable notes of a SAS log, and hides the notes on request', async () => {
    // A SAS log, fulfilled here rather than run: the parser, the three lists and
    // the switch are what this asserts, and none of them needs a SAS binary.
    // One line is longer than any pane, and carries no space to break at: a log
    // like this is what used to make the log a horizontal scroll container, so
    // clicking an issue slid it sideways and hid the start of every line.
    const longPath = `/Public/app/very/long/folder/name/${'segment/'.repeat(
      20
    )}program.sas`

    const log = [
      'NOTE: SAS (r) Proprietary Software 9.4 (TS1M9 MBCS3170)',
      '1    data want;',
      '2      x = age / 0;',
      '3    run;',
      'WARNING: Division by zero detected at line 3 column 11.',
      'NOTE: Variable y is uninitialized.',
      'ERROR Libref X is not assigned.',
      'NOTE 49-169: The meaning of an identifier after a quoted string may change.',
      'ERROR: File WORK.MISSING_DS.DATA does not exist.',
      `NOTE: the long path is ${longPath}`,
      ''
    ].join('\n')

    await page.route('**/SASjsApi/code/execute', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: ['<html></html>', log, ''].join(
          'SASJS_LOGS_SEPARATOR_163ee17b6ff24f028928972d80a26784'
        )
      })
    )

    // The fixture program is a .sas file, so opening it selects the SAS runtime
    // and the log pane will render the parsed shape.
    await page.click('button:has-text("RUN")')

    await page.waitForSelector('text=Errors (2)', { timeout: 30000 })
    expect(await page.isVisible('text=Warnings (1)')).toBe(true)
    expect(await page.isVisible('text=Notes (2)')).toBe(true)

    // A run with an error lands on the log: the error is the thing to read.
    // The panel is only visible when its tab is the selected one.
    expect(await page.isVisible('#logWrapper')).toBe(true)

    // The gutter: every rendered row is numbered, and the first row of the log
    // is line 1 rather than line 0.
    const firstRow = await page.textContent('[data-line-number="1"]')
    expect(firstRow?.trim()).toBe(
      '1NOTE: SAS (r) Proprietary Software 9.4 (TS1M9 MBCS3170)'
    )
    expect(await page.locator('[data-line-number]').count()).toBeGreaterThan(5)

    // A long line wraps instead of widening the pane, so the log is not a
    // horizontal scroll container at all.
    const overflow = await page.evaluate(() => {
      const wrapper = document.querySelector('#logWrapper') as HTMLElement
      return wrapper.scrollWidth - wrapper.clientWidth
    })
    expect(overflow).toBeLessThanOrEqual(1)

    // Clicking an issue reaches its line by scrolling DOWN. The old
    // scrollIntoView also made the line horizontally visible, which slid the
    // whole log right and put the start of every line out of view.
    await page.click('text=Errors (2)')
    await page.click(
      '[role="treeitem"]:has-text("File WORK.MISSING_DS.DATA does not exist.")'
    )
    await page.waitForTimeout(600)

    const afterClick = await page.evaluate(() => {
      const wrapper = document.querySelector('#logWrapper') as HTMLElement
      const line = document.getElementById('error_1') as HTMLElement
      const box = wrapper.getBoundingClientRect()
      const lineBox = line.getBoundingClientRect()

      return {
        left: wrapper.scrollLeft,
        // the issue's line is scrolled INTO the pane...
        inView: lineBox.top >= box.top - 1 && lineBox.top <= box.bottom,
        // ...and the start of it is still at the left edge
        atLeftEdge: lineBox.left >= box.left - 1
      }
    })
    expect(afterClick.left).toBe(0)
    expect(afterClick.inView).toBe(true)
    expect(afterClick.atLeftEdge).toBe(true)

    await page.screenshot({
      path: path.join(screenshotDir, '02-log-issues.png')
    })

    // The switch hides them without another run.
    await page.click('[aria-label="Hide notable notes"]')
    await page.waitForSelector('text=Notes (2)', {
      state: 'detached',
      timeout: 30000
    })
    expect(await page.isVisible('text=Errors (2)')).toBe(true)

    // It is a setting, so it is remembered rather than held in the component.
    const stored = await page.evaluate(() =>
      window.localStorage.getItem('studio-settings')
    )
    expect(JSON.parse(stored as string)['log.notableNotes']).toBe(false)
  }, 120000)
  it('keeps a log whole when the log itself holds the log separator, and shows the webout it came with', async () => {
    // A nested response - or a program whose source is echoed into its log, as
    // every compiled sasjs/core service is - puts the server's own separator
    // inside the log. Parsing to the FIRST occurrence cuts the log there, which
    // reads as a run that stopped mid-program (sasjs/server: the Studio showed
    // 2,022 of a 5,607 line log for such a program).
    const separator = 'SASJS_LOGS_SEPARATOR_163ee17b6ff24f028928972d80a26784'
    const webout = '<html><body><h1>webout page</h1></body></html>'
    const log = [
      'NOTE: the service said',
      `%let matchstr=${separator};`,
      'NOTE: ROWS AFTER THE NESTED LOG',
      'NOTE: the end of the run',
      ''
    ].join('\n')

    await page.route('**/SASjsApi/code/execute', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/plain',
        // The shape Execution.ts assembles: webout, the log framed by the
        // separator, joined with newlines.
        body: [webout, separator, log, separator].join('\n')
      })
    )

    // The response is mocked for this case only: an unrouted handler would
    // answer the execute call of every later test with this body.
    try {
      // The previous case left the run's log on screen; RUN lives on the code tab.
      await page.click('[role="tab"]:has-text("Code")')
      await page.click('button:has-text("RUN")')

      // No error in this log and a page in the reply, so the run opens on the
      // page it wrote rather than on the log: the log is where an error is.
      await page.waitForSelector('iframe[title="webout preview"]', {
        timeout: 30000
      })
      expect(await page.isVisible('iframe[title="webout preview"]')).toBe(true)

      // The whole log is a click away, and it is whole - the separator inside it
      // did not cut it short. The tab is clicked near its label: its centre
      // carries the notes switch and the download icon, and those stop the click
      // from reaching the tab.
      await page
        .locator('[role="tab"]:has-text("log")')
        .click({ position: { x: 8, y: 8 } })
      await page.waitForSelector('text=ROWS AFTER THE NESTED LOG', {
        timeout: 30000
      })
      expect(await page.isVisible('text=the end of the run')).toBe(true)
      expect(await page.isVisible('text=the service said')).toBe(true)

      await page.screenshot({
        path: path.join(screenshotDir, '04-log-with-nested-separator.png')
      })
    } finally {
      // Removes the handler this case installed AND the one the log-issues case
      // left behind, so no mock outlives the run that needed it.
      await page.unroute('**/SASjsApi/code/execute')
    }
  }, 120000)

  it('opens a clean run on the webout, ahead of the print output', async () => {
    const separator = 'SASJS_LOGS_SEPARATOR_163ee17b6ff24f028928972d80a26784'
    const webout = '<html><body><h1>clean run page</h1></body></html>'
    const log = ['NOTE: the run finished with nothing to report', ''].join('\n')
    const printOutput = 'The SAS System\nObs  x\n1  1\n'

    await page.route('**/SASjsApi/code/execute', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/plain',
        // Execution.ts assembles: webout, the log framed by the separator, then
        // the print output.
        body: [webout, separator, log, separator, printOutput].join('\n')
      })
    )

    try {
      await page.click('[role="tab"]:has-text("Code")')
      await page.click('button:has-text("RUN")')

      // Both outputs exist and neither the log nor the error list is why the run
      // happened: the page the program wrote is what the reader is shown.
      await page.waitForSelector('iframe[title="webout preview"]', {
        timeout: 30000
      })
      expect(await page.isVisible('iframe[title="webout preview"]')).toBe(true)

      // The print output is offered beside it and still carries its own panel.
      await page.click('[role="tab"]:has-text("print")')
      await page.waitForSelector('text=The SAS System', { timeout: 30000 })
      expect(await page.isVisible('text=The SAS System')).toBe(true)
    } finally {
      await page.unroute('**/SASjsApi/code/execute')
    }
  }, 120000)

  it('opens a one-line JSON file indented, and leaves the drive file alone', async () => {
    await page.click(`text=${JSON_FILE_NAME}`)
    await page.waitForFunction(
      () => document.querySelectorAll('.view-lines .view-line').length > 1,
      { timeout: 30000 }
    )
    await page.waitForTimeout(1000)

    // Monaco renders a space in the text layer as a non-breaking space, so the
    // text is normalised before it is read as the file's content.
    const shown = await page.evaluate(() =>
      (document.querySelector('.view-lines') as HTMLElement).innerText.replace(
        /\u00a0/g,
        ' '
      )
    )

    // Indented, one member per line, rather than the stored single line.
    expect(shown.split('\n').length).toBeGreaterThan(1)
    expect(shown).toContain('"tabSize": 2')
    expect(shown).toContain('"runTimes": [')

    // Opening a file is not saving it: the drive holds what it held.
    expect(
      await readFile(path.join(driveLocation, 'files', JSON_FILE_NAME), 'utf8')
    ).toBe(MINIFIED_JSON)

    await page.screenshot({
      path: path.join(screenshotDir, '05-json-indented.png')
    })

    // The buffer opens clean, because nothing has been changed yet.
    expect(
      await page.locator('button[aria-label="Save (unsaved changes)"]').count()
    ).toBe(0)

    // A file that already carries its own indent is shown as it is stored -
    // reformatting it would rewrite whitespace the author chose.
    await page.click(`text=${INDENTED_JSON_NAME}`)
    await page.waitForFunction(
      () => document.querySelectorAll('.view-lines .view-line').length > 3,
      { timeout: 30000 }
    )
    await page.waitForTimeout(1000)

    const asStored = await page.evaluate(() =>
      (document.querySelector('.view-lines') as HTMLElement).innerText
        .replace(/\u00a0/g, ' ')
        .trimEnd()
    )
    expect(asStored).toBe(INDENTED_JSON)
  }, 60000)

  it('shows a disk that carries a blue dot while the buffer holds unsaved edits', async () => {
    await page.click(`text=${SAVE_FILE_NAME}`)
    await page.waitForFunction(
      () => document.querySelectorAll('.view-lines .view-line').length > 2,
      { timeout: 30000 }
    )

    const saveButton = () =>
      page.locator('button[aria-label="Save (unsaved changes)"]')
    const idleButton = () =>
      page.locator('button[aria-label="Nothing to save"]')

    // The dot itself: MUI keeps the badge in the DOM and scales it away when it
    // is invisible, so its measured size is what says whether it shows.
    const dot = () =>
      page.evaluate(() => {
        const badge = document.querySelector('.MuiBadge-dot') as HTMLElement

        if (!badge) return null

        const box = badge.getBoundingClientRect()

        return {
          width: box.width,
          height: box.height,
          colour: getComputedStyle(badge).backgroundColor
        }
      })

    // Nothing to write, so the disk is disabled rather than doing nothing
    // silently when clicked.
    expect(await idleButton().count()).toBe(1)
    expect(await idleButton().isDisabled()).toBe(true)
    expect((await dot())?.width ?? 0).toBe(0)

    await page.click('.monaco-editor')
    await page.keyboard.press('Control+End')
    await page.keyboard.type('x')

    // The dot appears, and it is the palette's blue rather than the theme's
    // primary, which is black.
    expect(await saveButton().count()).toBe(1)
    expect(await saveButton().isDisabled()).toBe(false)
    await page.waitForTimeout(500)

    const painted = await dot()
    expect(painted?.width).toBeGreaterThan(0)
    expect(painted?.height).toBeGreaterThan(0)
    expect(painted?.colour).toBe('rgb(30, 136, 229)')

    await page.screenshot({
      path: path.join(screenshotDir, '04-save-dot.png')
    })

    // Saving writes the buffer and takes the dot away.
    await saveButton().click()
    await page.waitForSelector('text=File saved!', { timeout: 30000 })
    await page.waitForTimeout(500)

    expect(await idleButton().count()).toBe(1)
    expect(await idleButton().isDisabled()).toBe(true)
    expect((await dot())?.width ?? 0).toBe(0)
    const onDrive = await readFile(
      path.join(driveLocation, 'files', SAVE_FILE_NAME),
      'utf8'
    )
    expect(onDrive).not.toBe(SAVE_FILE_CONTENT)
  }, 120000)

  it('drops a paste that follows a right click, and takes an ordinary paste', async () => {
    // A paste as the browser delivers it, into the editor's input element.
    const paste = (text: string) =>
      page.evaluate((text) => {
        const data = new DataTransfer()
        data.setData('text/plain', text)

        document.querySelector('.monaco-editor textarea')!.dispatchEvent(
          new ClipboardEvent('paste', {
            clipboardData: data,
            bubbles: true,
            cancelable: true
          })
        )
      }, text)

    const shown = () =>
      page.evaluate(
        () => (document.querySelector('.view-lines') as HTMLElement).innerText
      )

    await page.click('.monaco-editor')
    await page.keyboard.press('Control+End')

    const beforeGesture = await shown()
    const box = (await page.locator('.monaco-editor').boundingBox())!

    // A right press followed by the paste the browser can send it - with NO
    // key in between, which is what makes this the gesture and not the user.
    // The editor ignores it, so text cannot appear from a right click.
    await page.mouse.click(box.x + 200, box.y + 40, { button: 'right' })
    await paste('MOUSEPASTE')
    await page.waitForTimeout(300)

    expect(await shown()).toBe(beforeGesture)

    // What the guard must never swallow is an ordinary paste. Escape closes the
    // menu and is itself a key down, so this case does not isolate WHICH
    // disarm did the work - the two arms of that (a left press, a key down) are
    // asserted directly in web/scripts/test-mouse-paste-guard.mjs, where no
    // menu and no Escape stand between the gesture and the paste.
    await page.keyboard.press('Escape')
    await page.mouse.click(box.x + 200, box.y + 40)
    await paste('USERPASTE')
    await page.waitForTimeout(300)

    expect(await shown()).toContain('USERPASTE')
  }, 120000)

  /**
   * The one path that made Studio flash the default program.
   *
   * Entering Studio asks the drive whether the remembered file is still there.
   * Any failure used to read as "gone", so the check going wrong - a refusal, a
   * timeout, a 5xx - opened /home/<user>/program.sas over the file the user was
   * last writing. Only a 404 is the drive saying the file is gone; here the
   * check is refused, and the remembered file must still open.
   */
  /**
   * Opening Studio must not ask the drive to create a program that is already
   * there. It used to: the refusal was the answer, and the browser logged the
   * 409 as a console error on a screen that had done nothing wrong.
   */
  it('does not create the default program when it is already there', async () => {
    const writes: number[] = []

    page.on('response', (response) => {
      if (
        response.request().method() === 'POST' &&
        response.url().includes('/SASjsApi/drive/file')
      )
        writes.push(response.status())
    })

    await page.goto(`${baseUrl()}/SASjsStudio`, {
      waitUntil: 'domcontentloaded'
    })
    await page.waitForSelector('.monaco-editor', { timeout: 30000 })
    await page.waitForTimeout(3000)

    expect(writes).toEqual([])
  }, 120000)

  it('opens the remembered file when the drive cannot be asked whether it is there', async () => {
    const rememberedPath = `/${PROGRAM_NAME}`
    const asked: string[] = []

    page.on('request', (request) => {
      if (!request.url().includes('/SASjsApi/drive/')) return

      const requestUrl = new URL(request.url())
      const askedFor =
        requestUrl.searchParams.get('_filePath') ??
        requestUrl.searchParams.get('_folderPath')

      if (askedFor !== null) asked.push(`${requestUrl.pathname} ${askedFor}`)
    })

    // Open the program by URL, which is what remembers it. The editor states the
    // open as the URL's `filePath`, so that is what tells us it landed.
    await page.goto(
      `${baseUrl()}/SASjsStudio?filePath=${encodeURIComponent(rememberedPath)}`
    )
    await page.waitForFunction(
      () => decodeURIComponent(location.search).includes('/studio-test.sas'),
      { timeout: 30000 }
    )
    await page.waitForTimeout(1500)

    // The next drive-file read is the check. Refuse it, the way a proxy or a
    // restarting server would.
    let refused = 0
    // the check is the folder listing now, so that is what is refused
    const check = '**/SASjsApi/drive/fileTree?**'

    await page.route(check, async (route) => {
      if (refused === 0) {
        refused += 1
        await route.fulfill({ status: 500, body: 'the drive could not answer' })
        return
      }

      await route.continue()
    })

    asked.length = 0

    // Back out to the dashboard and re-enter Studio through the tab: the way
    // the report described it, and the way a user gets there.
    await page.goto(baseUrl())
    await page.waitForSelector('text=Recently used apps', { timeout: 30000 })
    await page.click('[role="tab"]:has-text("STUDIO")')

    await page.waitForFunction(
      () => decodeURIComponent(location.search).includes('/studio-test.sas'),
      { timeout: 30000 }
    )

    expect(refused).toBe(1)
    // The default program was never opened, and never asked for.
    expect(asked.some((asked) => asked.includes('program.sas'))).toBe(false)

    await page.unroute(check)
  }, 120000)
})
