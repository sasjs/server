/**
 * Browser test of the API tab.
 *
 * The tab links to `/api`, which is where the server now serves Swagger UI -
 * the same page as `/SASjsApi/`, served from the same folder, and the prefix
 * the API itself answers on. The test checks the two halves a reader depends
 * on: the page is served at the short prefix with its own assets, and the tab
 * opens it.
 *
 * It also checks that the short prefix is a real alias of the API rather than a
 * second copy of the documentation: a request to `/api/info` has to reach the
 * same controller as `/SASjsApi/info`, so a client that picks either spelling
 * gets the same answer.
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

const user = {
  displayName: 'API Screen User',
  // Lowercase alphanumeric, at most 16 characters (usernameSchema).
  username: 'apiscreen',
  password: '87654321',
  isAdmin: true,
  isActive: true
}

const NEW_PASSWORD = 'newpass123'

describe('API tab', () => {
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

  it('serves Swagger UI at /api-assets, frames it at /api, and answers the API on both spellings', async () => {
    // The page is served under its own mount, and its assets are addressed
    // relatively, so a page served at /api-assets/ asks for
    // /api-assets/swagger-ui.css rather than /swagger-ui.css. The assets
    // themselves are a build artifact (`npm run swagger-ui:copy`), not source,
    // so the browser suite does not require them; the reference in the tracked
    // page is what is asserted.
    const docs = await fetch(`${baseUrl()}/api-assets/`)
    expect(docs.status).toBe(200)

    const markup = await docs.text()
    expect(markup).toContain('swagger-ui')
    expect(markup).toContain('./swagger-ui.css')

    // The specification the page loads IS source, and is served from the root
    // whichever prefix the page is reached on.
    expect((await fetch(`${baseUrl()}/swagger.yaml`)).status).toBe(200)

    // /api is the interface's route now, so it answers with the app shell...
    const shell = await (await fetch(`${baseUrl()}/api`)).text()
    expect(shell).toContain('<div id=root>')

    // ...while the API itself still answers there, with the same answer as the
    // canonical spelling it is an alias of.
    const aliased = await fetch(`${baseUrl()}/api/info`)
    const canonical = await fetch(`${baseUrl()}/SASjsApi/info`)

    expect(aliased.status).toBe(200)
    expect(await aliased.json()).toEqual(await canonical.json())

    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 }
    })

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

    // The screen is the app, with the API's page inside it: the header stays,
    // and the address is the app's route.
    await page.waitForSelector('iframe[src^="/api-assets"]', {
      timeout: 30000
    })

    expect(new URL(page.url()).pathname).toBe('/api')

    // the frame is attached before it has a URL, so its presence and its
    // address arrive at different moments
    let frame = page
      .frames()
      .find((candidate) => candidate.url().includes('/api-assets'))

    for (let attempt = 0; !frame && attempt < 80; attempt++) {
      await page.waitForTimeout(250)
      frame = page
        .frames()
        .find((candidate) => candidate.url().includes('/api-assets'))
    }

    expect(frame).toBeDefined()

    await page.screenshot({ path: path.join(screenshotDir, 'api-tab.png') })

    await page.close()
  }, 120000)
})
