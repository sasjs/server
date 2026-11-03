#!/usr/bin/env node
// first, and deliberately: it installs the fatal guards as a side effect, before
// ./app and its dependency graph initialise (see the module's own note)
import './fatalGuards'

import { Express } from 'express'
import appPromise from './app'
import { listen } from './listen'
import { resolveListeners } from './utils'
import { SessionController } from './controllers/internal'

/**
 * Ends every session the server is holding, so a stop does not orphan their
 * processes.
 *
 * Controllers are created lazily, on the first request for their runtime, so one
 * that was never used has no session pool and nothing to stop. `sasviya` sessions
 * run on the Viya server and are not represented here at all.
 *
 * Both are drained together rather than in turn: three pooled SAS sessions must
 * not cost three graces.
 */
const drainSessions = async () => {
  const controllers = [
    process.sessionController,
    process.sasSessionController
  ].filter(Boolean) as SessionController[]

  await Promise.all(controllers.map((controller) => controller.drain()))
}

appPromise.then(async (app: Express) => {
  const { config, errors, warnings } = resolveListeners(process.env)

  warnings.forEach((warning: string) =>
    process.logger.warn(`[server] ${warning}`)
  )

  if (!config) {
    errors.forEach((error: string) => process.logger.error(`[server] ${error}`))
    process.logger.error(
      '[server] refusing to start: no usable listener configuration'
    )
    process.exit(1)
  }

  let listeners

  try {
    listeners = await listen(app, config)
  } catch (error: any) {
    process.logger.error(`[server] ${error?.message ?? error}`)
    process.exit(1)
  }

  process.logger.info(`⚡️[server]: listening: ${listeners.description}`)

  const stop = async (signal: string) => {
    process.logger.info(`[server] ${signal} received, closing listeners`)

    // waits for in-flight requests, with a ceiling of its own
    await listeners.close()

    // then the work those requests started. A session is a child process, and an
    // exit that leaves one behind keeps a SAS licence seat (and the folder it is
    // writing to) busy until its own idle ceiling expires - up to 15 minutes per
    // pooled session, on every restart.
    await drainSessions()

    process.exit(0)
  }

  process.on('SIGINT', () => stop('SIGINT'))
  process.on('SIGTERM', () => stop('SIGTERM'))
})
