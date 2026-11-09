import path from 'path'
import fs from 'fs'
import express from 'express'

import { permittedAppStreamConfig } from '../appStream'
import { resolveWithinDrive } from '../../utils'

const router = express.Router()

/** The file the app stream serves for a directory request. */
const ENTRY_FILE = 'index.html'

/**
 * What is registered under one app name.
 *
 * `GET /AppStream/apps.json` is enough for the landing screen and not enough for
 * anyone else: a deploy script cannot answer "what is at this name right now",
 * and an operator cannot answer "when was it last published, and from what". The
 * data is already on disk, so this describes it rather than modelling anything
 * new.
 *
 * Decided by the same grant rule as the listing - an app a caller may not open
 * is not describable either, and answers 404 rather than 403: the name's
 * existence is itself information the caller has no grant on.
 */
router.get('/:name', async (req, res) => {
  const name = req.params.name

  const permitted = await permittedAppStreamConfig(req)

  const entry = permitted[name]

  if (!entry) {
    return res.status(404).json({
      status: 'failure',
      message: `No App Stream is registered under "${name}".`
    })
  }

  const appLocPath = resolveWithinDrive(entry.appLoc)
  const deploymentPath = appLocPath
    ? path.join(appLocPath, 'services', entry.streamWebFolder)
    : undefined
  const entryFilePath = deploymentPath
    ? path.join(deploymentPath, ENTRY_FILE)
    : undefined

  // Stated rather than assumed: a registry entry can outlive its deployment (a
  // folder deleted out from under the server), and reporting a file and a date
  // that do not exist would be worse than reporting none.
  let entryFileExists = false
  let lastModified: string | null = null

  if (entryFilePath) {
    try {
      const stats = await fs.promises.stat(entryFilePath)

      entryFileExists = stats.isFile()
      lastModified = stats.mtime.toISOString()
    } catch (_) {
      entryFileExists = false
    }
  }

  res.json({
    name,
    appLoc: entry.appLoc,
    streamWebFolder: entry.streamWebFolder,
    streamLogo: entry.streamLogo,
    frameAncestors: entry.frameAncestors,
    publishedAt: entry.publishedAt ?? null,
    entryFile: ENTRY_FILE,
    entryFileExists,
    lastModified,
    url: `/app/${encodeURIComponent(name)}/`
  })
})

export default router
