import express from 'express'

import {
  createDeploymentFileService,
  DEPLOYMENT_FILE_ERROR,
  isApiError
} from '@sasjs/api'

import { nodeDriveStore } from '../controllers/internal/nodeDriveStore'

/**
 * The read a streamed deployment links to, as this host serves it.
 *
 * What the answer is - typed by extension, cached by name, and `202` with the
 * estate's own words when the file is not there - is `@sasjs/api`'s, so the
 * browser build answers exactly as this server does and a fault reproduced in a
 * mock site is the fault being chased. This is the transport: the drive's store,
 * the status the package decided, and the bytes.
 *
 * Re-exported because the route's suite states the refusal by name.
 */
export { DEPLOYMENT_FILE_ERROR }

export const sendDeploymentFile = async (
  request: express.Request,
  response: express.Response,
  input: unknown
) => {
  try {
    const page = await createDeploymentFileService(nodeDriveStore()).read(input)

    response.status(page.status)

    if (page.contentType) response.type(page.contentType)

    for (const [name, value] of Object.entries(page.headers ?? {}))
      response.setHeader(name, value)

    return response.send(
      typeof page.body === 'string' ? page.body : Buffer.from(page.body ?? '')
    )
  } catch (error) {
    // the drive's refusals - a path outside it, a blocked extension - are a
    // `400` with the package's wording, which is the wording this route's own
    // file read answers with
    if (isApiError(error))
      return response.status(error.status).send(error.message)

    throw error
  }
}
