import express from 'express'
import { Get, Path, Request, Response, Route, Security, Tags } from 'tsoa'

import {
  appIsGranted,
  appStreamService,
  loadRouteRules,
  ModeType
} from '../utils'
import { nodeDriveStore } from './internal/nodeDriveStore'
import { HttpError } from '../utils'
import User from '../model/User'
import { isApiError, type AppStreamEntry } from '@sasjs/api'

/** The file the app stream serves for a directory request. */
const ENTRY_FILE = 'index.html'

const NOT_REGISTERED = 'No App Stream is registered with that id.'

/**
 * What is published under one App Stream id.
 *
 * `/app/apps.json` is enough for the landing screen and not enough for anyone else:
 * a deploy script cannot answer "what is at this id right now", and an operator
 * cannot answer "when was it last published, and from what". The data is already on
 * disk, so this describes it rather than modelling anything new.
 */
export interface AppDetailsResponse {
  /** The app's identifier, which is what a publish answers with and its URL carries. */
  id: string

  /** The name the app is published under. A name may be shared; the id may not. */
  name: string

  /** The folder within SASjs Drive the app was published from. */
  appLoc: string

  /** The folder inside `appLoc` holding the streamed web assets. */
  streamWebFolder: string

  /** A logo to show on the app's tile, when one was registered. */
  logo?: string

  /** Origins allowed to frame the app, when any were registered. */
  frameAncestors?: string[]

  /** When the app was last published, if the index records it. */
  publishedAt: string | null

  /** The entry file the app stream serves for a directory request. */
  entryFile: string

  /**
   * Whether that entry file is on disk right now. An index entry can outlive its
   * deployment, and reporting a file that is not there would be worse than
   * reporting none.
   */
  entryFileExists: boolean

  /** When the entry file was last modified, if it is there. */
  lastModified: string | null

  /** Where the app opens, which is its id under the App Stream prefix. */
  url: string
}

/**
 * What is published under an App Stream id.
 *
 * Addressed by **id**, which is what a publish answers with and what the app's own
 * URL carries. A name is not looked up here, because a name is shared by design and
 * "the app with this name" is not one app.
 */
@Route('SASjsApi/app')
@Tags('App Stream')
@Security('bearerAuth')
export class AppController {
  /**
   * Describes one published app, and the entry file it is served from.
   *
   * Decided by the same grant rule as the listing: an app the caller may not open is
   * not describable either, and answers `404` rather than `403`, because the id's
   * existence is itself information the caller has no grant on.
   *
   * @summary Get a published app by id
   * @param id The app's identifier, as a publish answered with it
   * @example id "3f2b9c1e-1a2b-4c3d-8e9f-0a1b2c3d4e5f"
   */
  @Response(401, 'Unauthorized')
  @Response(404, 'No App Stream is registered with that id.')
  @Response(500, 'Internal Server Error')
  @Get('{id}')
  public async getApp(
    @Request() req: express.Request,
    @Path() id: string
  ): Promise<AppDetailsResponse> {
    let entry: AppStreamEntry

    try {
      entry = await appStreamService().get(id)
    } catch (err) {
      // The package answers an id it does not hold with its own 404, and this route
      // adds nothing to that answer.
      //
      // Anything else is rethrown rather than reported as NOT_REGISTERED: a 404 here
      // promises that no app holds this id, and only the package's own answer says
      // that. What this does NOT cover is an index that cannot be read - the store
      // behind the package catches that, logs it and answers an empty index on purpose
      // (`readStoredAppStreamEntries`), so a broken registry arrives here as the same
      // 404 and reads as "no such app". That trade is deliberate: the apps listing
      // shows nothing rather than failing. Changing it changes what the listing does,
      // not what this route does.
      if (isApiError(err) && err.status === 404)
        throw new HttpError(404, NOT_REGISTERED)

      throw err
    }

    if (!(await this.mayOpen(req, entry)))
      throw new HttpError(404, NOT_REGISTERED)

    const entryFilePath = `${entry.appLoc}/services/${entry.streamWebFolder}/${ENTRY_FILE}`

    // Stated rather than assumed: an index entry can outlive its deployment (a
    // folder deleted out from under the server), and reporting a file and a date
    // that do not exist would be worse than reporting none.
    let entryFileExists = false
    let lastModified: string | null = null

    try {
      const stats = await nodeDriveStore().stat(entryFilePath)

      entryFileExists = !stats.directory
      // a directory named index.html is not the entry file, and dating it would answer
      // `entryFileExists: false` beside a modification time
      lastModified = entryFileExists ? (stats.modified ?? null) : null
    } catch (_) {
      entryFileExists = false
    }

    return {
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
    }
  }

  /**
   * Whether this caller may see one app, decided by the same rule as the listing and
   * the gate: a grant on the app's id, on the name it carries, or on `/AppStream`
   * itself. Desktop mode has no permission model.
   */
  private async mayOpen(
    req: express.Request,
    entry: AppStreamEntry
  ): Promise<boolean> {
    if (process.env.MODE === ModeType.Desktop) return true

    const dbUser = await User.findOne({ _id: req.user?.userId })

    if (!dbUser) return false

    if (dbUser.isAdmin) return true

    return appIsGranted(entry, await loadRouteRules(dbUser))
  }
}
