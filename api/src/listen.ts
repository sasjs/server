import { Express } from 'express'
import { createServer as createHttpServer, Server } from 'http'
import { createServer as createHttpsServer } from 'https'

import { getCertificates } from './utils/getCertificates'
import { ListenerConfig } from './utils/resolveListeners'

/** How long in-flight requests get to finish before their sockets are dropped. */
const SHUTDOWN_CEILING_MS = 5000

export interface RunningListeners {
  servers: Server[]
  /** What to log, e.g. `https on *:443, http on 127.0.0.1:5000`. */
  description: string
  /** Stops accepting connections and drops the ones already open. */
  close: () => Promise<void>
}

/**
 * Mounts the same express app on every enabled listener.
 *
 * One app, not one per listener: routes, authentication, CSRF protection and
 * sessions are identical by construction, which is the property a second app
 * would have to be kept in step with by hand.
 *
 * A bind failure rejects rather than being logged and ignored, so the caller can
 * stop the process: half a server - TLS up and plain HTTP absent, or the reverse -
 * is worse than not starting, because the client that used the missing listener
 * gets a connection refused far from the line that explains it.
 */
export const listen = async (
  app: Express,
  config: ListenerConfig
): Promise<RunningListeners> => {
  const servers: Server[] = []
  const listening: string[] = []

  const bind = (
    server: Server,
    variable: string,
    port: number,
    address?: string
  ) =>
    new Promise<void>((resolve, reject) => {
      const onError = (error: NodeJS.ErrnoException) => {
        server.removeListener('listening', onListening)
        reject(
          new Error(`${variable} could not bind port ${port}: ${error.message}`)
        )
      }

      const onListening = () => {
        server.removeListener('error', onError)
        resolve()
      }

      server.once('error', onError)
      server.once('listening', onListening)
      server.listen(port, address)
    })

  /**
   * Stops accepting connections, lets the requests already in flight finish, and
   * resolves when every listener has closed - or after a short ceiling, so a
   * client that holds a request open cannot keep the process alive past an
   * orchestrator's kill timeout.
   */
  const close = async () => {
    const closed = servers.map(
      (server) =>
        new Promise<void>((resolve) => {
          server.close(() => resolve())
          server.closeIdleConnections?.()
        })
    )

    let timer: NodeJS.Timeout | undefined

    const ceiling = new Promise<void>((resolve) => {
      timer = setTimeout(() => {
        // whatever is still open now is not going to finish in time: drop it
        servers.forEach((server) => server.closeAllConnections?.())
        resolve()
      }, SHUTDOWN_CEILING_MS)
    })

    await Promise.race([Promise.all(closed), ceiling])

    if (timer) clearTimeout(timer)
  }

  try {
    if (config.httpsPort) {
      const { key, cert, ca } = await getCertificates()

      const httpsServer = createHttpsServer({ key, cert, ca }, app)

      await bind(
        httpsServer,
        'HTTPS_PORT',
        config.httpsPort,
        config.httpsBindAddress
      )

      servers.push(httpsServer)
      listening.push(
        `https on ${config.httpsBindAddress ?? '*'}:${config.httpsPort}`
      )
    }

    if (config.httpPort) {
      const httpServer = createHttpServer(app)

      await bind(
        httpServer,
        'HTTP_PORT',
        config.httpPort,
        config.httpBindAddress
      )

      servers.push(httpServer)
      listening.push(`http on ${config.httpBindAddress}:${config.httpPort}`)
    }
  } catch (error) {
    close()
    throw error
  }

  return { servers, description: listening.join(', '), close }
}
