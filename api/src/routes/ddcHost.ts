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
 * GET /ddc-host?url=<app url>[&sandbox=...][&message=<json>][&timing=...][&height=600][&title=...]
 *
 * The page and its script are kept in src/views rather than public/ so that they
 * are only reachable through these routes: an endpoint that frames an arbitrary
 * URL is a testing tool, and should not be available on a production server
 * unless asked for. Enable with DDC_HOST_ENABLED=true.
 *
 * The script is a separate file because the server's CSP allows scripts from
 * 'self' only, so an inline script on this page is refused by the browser. The
 * page keeps working without it (it renders, the frame stays empty), which is
 * what makes that a silent failure worth avoiding.
 */

const PAGE_PATH = path.join(__dirname, '../views/ddc-host.html')
const SCRIPT_PATH = path.join(__dirname, '../views/ddc-host.js')

const ddcHostRouter = express.Router()

const isEnabled = () =>
  ['1', 'true', 'yes', 'y'].includes(
    (process.env.DDC_HOST_ENABLED || '').trim().toLowerCase()
  )

/** Serves one of the host page's own files, or 404 when the tool is off. */
const serveFile =
  (filePath: string, contentType: string) =>
  (_req: express.Request, res: express.Response) => {
    if (!isEnabled()) {
      // 404 rather than 403: a disabled testing tool should not announce itself.
      return res.status(404).send('Not found')
    }

    let content: string
    try {
      content = fs.readFileSync(filePath, 'utf8')
    } catch (err: any) {
      return res
        .status(500)
        .send('Could not read the host page: ' + err.message)
    }

    return res.type(contentType).send(content)
  }

ddcHostRouter.get('/ddc-host', serveFile(PAGE_PATH, 'html'))
ddcHostRouter.get(
  '/ddc-host.js',
  serveFile(SCRIPT_PATH, 'application/javascript')
)

export { ddcHostRouter, PAGE_PATH, SCRIPT_PATH }
