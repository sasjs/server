import express from 'express'
import fs from 'fs'
import path from 'path'

/**
 * A host page that embeds an application the way SAS Visual Analytics embeds
 * data-driven content, for testing an app's embed behaviour without a VA
 * instance.
 *
 * VA wraps the object in an iframe with a fixed sandbox attribute set (held in
 * the page itself, which is the only place it needs to live) and talks to it
 * with postMessage. Both are part of the
 * contract an embedded app has to satisfy, and neither is exercised when the app
 * is opened as a top-level document - so a regression in the sandboxed case only
 * shows up in a real report.
 *
 * GET /ddc-host?url=<app url>[&sandbox=...][&message=<json>][&height=600][&title=...]
 *
 * The page is kept in src/views rather than public/ so that it is only reachable
 * through this route: an endpoint that frames an arbitrary URL is a testing
 * tool, and should not be available on a production server unless asked for.
 * Enable with DDC_HOST_ENABLED=true.
 *
 */

const PAGE_PATH = path.join(__dirname, '../views/ddc-host.html')

const ddcHostRouter = express.Router()

const isEnabled = () =>
  ['1', 'true', 'yes', 'y'].includes(
    (process.env.DDC_HOST_ENABLED || '').trim().toLowerCase()
  )

ddcHostRouter.get('/ddc-host', (_req, res) => {
  if (!isEnabled()) {
    // 404 rather than 403: a disabled testing tool should not announce itself.
    return res.status(404).send('Not found')
  }

  let page: string
  try {
    page = fs.readFileSync(PAGE_PATH, 'utf8')
  } catch (err: any) {
    return res.status(500).send('Could not read the host page: ' + err.message)
  }

  return res.type('html').send(page)
})

export { ddcHostRouter, PAGE_PATH }
