import { Express } from 'express'
import { createServer as createHttpServer, Server } from 'http'
import { createServer as createHttpsServer } from 'https'

import appPromise from './app'
import { getCertificates, ListenerConfig, resolveListeners } from './utils'

/**
 * Every enabled listener mounts the same express app: routes, authentication,
 * CSRF protection, sessions and logging are identical by construction, because
 * there is one app and not one per listener.
 *
 * A bind failure on either listener stops the process. Half a server - TLS up and
 * plain HTTP absent, or the reverse - is worse than not starting, because the
 * client that used the missing listener gets a connection refused far from the
 * line that explains it.
 */
const listen = async (app: Express, config: ListenerConfig) => {
  const servers: Server[] = []
  const listening: string[] = []

  const closeAll = () => servers.forEach((server) => server.close())

  const failFast =
    (variable: string, port: number) => (error: NodeJS.ErrnoException) => {
      process.logger.error(
        `[server] ${variable} could not bind port ${port}: ${error.message}`
      )
      closeAll()
      process.exit(1)
    }

  if (config.httpsPort) {
    const { key, cert, ca } = await getCertificates()

    const httpsServer = createHttpsServer({ key, cert, ca }, app)

    httpsServer.on('error', failFast('HTTPS_PORT', config.httpsPort))
    httpsServer.listen(config.httpsPort, config.httpsBindAddress)

    servers.push(httpsServer)
    listening.push(
      `https on ${config.httpsBindAddress ?? '*'}:${config.httpsPort}`
    )
  }

  if (config.httpPort) {
    const httpServer = createHttpServer(app)

    httpServer.on('error', failFast('HTTP_PORT', config.httpPort))
    httpServer.listen(config.httpPort, config.httpBindAddress)

    servers.push(httpServer)
    listening.push(`http on ${config.httpBindAddress}:${config.httpPort}`)
  }

  process.logger.info(`⚡️[server]: listening: ${listening.join(', ')}`)

  const stop = (signal: string) => {
    process.logger.info(`[server] ${signal} received, closing listeners`)
    closeAll()
  }

  process.on('SIGINT', () => stop('SIGINT'))
  process.on('SIGTERM', () => stop('SIGTERM'))
}

appPromise.then(async (app) => {
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

  await listen(app, config)
})
