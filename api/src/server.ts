#!/usr/bin/env node
import { Express } from 'express'
import appPromise from './app'
import { listen } from './listen'
import { resolveListeners } from './utils'

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

    process.exit(0)
  }

  process.on('SIGINT', () => stop('SIGINT'))
  process.on('SIGTERM', () => stop('SIGTERM'))
})
