import express from 'express'

import {
  appIsGranted,
  appStreamService,
  loadRouteRules,
  ModeType
} from '../../utils'
import { nodeDriveStore } from '../../controllers/internal/nodeDriveStore'
import User from '../../model/User'
import type { AppStreamEntry } from '@sasjs/api'

const router = express.Router()

/** The file the app stream serves for a directory request. */
const ENTRY_FILE = 'index.html'

/**
 * Whether this caller may see one app, decided by the same rule as the listing
 * and the gate: a grant on the app's id, on the label it carries, or on
 * `/AppStream` itself. Desktop mode has no permission model.
 */
const mayOpen = async (
  req: express.Request,
  entry: AppStreamEntry
): Promise<boolean> => {
  if (process.env.MODE === ModeType.Desktop) return true

  const dbUser = await User.findOne({ _id: req.user?.userId })

  if (!dbUser) return false

  if (dbUser.isAdmin) return true

  return appIsGranted(entry, await loadRouteRules(dbUser))
}

/**
 * What is published under one app id.
 *
 * `/app/apps.json` is enough for the landing screen and not enough for anyone
 * else: a deploy script cannot answer "what is at this id right now", and an
 * operator cannot answer "when was it last published, and from what". The data is
 * already on disk, so this describes it rather than modelling anything new.
 *
 * Addressed by **id**, which is what a publish answers with and what the app's
 * own URL carries. A label is not looked up here, because a label is shared by
 * design and "the app with this name" is not one app.
 *
 * Decided by the same grant rule as the listing - an app a caller may not open is
 * not describable either, and answers `404` rather than `403`: the id's existence
 * is itself information the caller has no grant on.
 */
router.get('/:id', async (req, res) => {
  const id = req.params.id

  let entry: AppStreamEntry

  try {
    entry = await appStreamService().get(id)
  } catch (_) {
    // the package answers an id it does not hold with a 404, and this route adds
    // nothing to that answer
    return res.status(404).json({
      status: 'failure',
      message: `No App Stream is registered with that id.`
    })
  }

  if (!(await mayOpen(req, entry)))
    return res.status(404).json({
      status: 'failure',
      message: `No App Stream is registered with that id.`
    })

  const entryFilePath = `${entry.appLoc}/services/${entry.streamWebFolder}/${ENTRY_FILE}`

  // Stated rather than assumed: an index entry can outlive its deployment (a
  // folder deleted out from under the server), and reporting a file and a date
  // that do not exist would be worse than reporting none.
  let entryFileExists = false
  let lastModified: string | null = null

  try {
    const stats = await nodeDriveStore().stat(entryFilePath)

    entryFileExists = !stats.directory
    lastModified = stats.modified ?? null
  } catch (_) {
    entryFileExists = false
  }

  res.json({
    id: entry.id,
    name: entry.name,
    appLoc: entry.appLoc,
    streamWebFolder: entry.streamWebFolder,
    logo: entry.logo,
    frameAncestors: entry.frameAncestors,
    publishedAt: entry.publishedAt ?? null,
    entryFile: ENTRY_FILE,
    entryFileExists,
    lastModified,
    url: `/app/${entry.id}/`
  })
})

export default router
