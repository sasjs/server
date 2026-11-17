import express from 'express'

import {
  assertOneFileName,
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

/**
 * Answers a request that names the file twice, and says whether it did.
 *
 * The rule and its wording are the package's, so this route and the dispatcher
 * refuse the same caller with the same `400` - the read has two names because
 * they answer differently, and choosing one silently would answer a question
 * nobody asked.
 */
export const refuseTwoNames = (
  request: express.Request,
  response: express.Response
): boolean => {
  try {
    assertOneFileName(request.query)
  } catch (error) {
    if (!isApiError(error)) throw error

    response.status(error.status).send(error.message)
    return true
  }

  return false
}

export const sendDeploymentFile = async (
  _request: express.Request,
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
