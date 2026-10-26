import { Express } from 'express'
import { createServer as createHttpServer, Server } from 'http'
import { createServer as createHttpsServer } from 'https'

import { getCertificates } from './utils/getCertificates'
import { ListenerConfig } from './utils/resolveListeners'

export interface RunningListeners {
  servers: Server[]
  /** What to log, e.g. `https on *:443, http on 127.0.0.1:5000`. */
  description: string
  /** Stops accepting connections and drops the ones already open. */
  close: () => void
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

  const close = () => {
    // close() stops accepting connections but leaves established keep-alive
    // sockets open, so an orchestrator would wait out its kill timeout
    servers.forEach((server) => {
      server.close()
      server.closeAllConnections?.()
    })
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
