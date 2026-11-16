import express from 'express'
import {
  formatCodeValidation,
  lintCodeValidation,
  runCodeValidation,
  triggerCodeValidation
} from '../../utils'
import { CodeController } from '../../controllers/'

const runRouter = express.Router()

const controller = new CodeController()

/**
 * Answers with the error's own status when it carries one, and a 500 when it does
 * not.
 *
 * `err.code` is how the controllers signal a status (`UnauthorizedError` carries
 * 401, the drive readers 403 and 404). Anything else that throws on the way - a
 * drive root that is not set, a bug in a controller - has no `code`, and
 * `res.status(undefined)` itself throws ERR_HTTP_INVALID_STATUS_CODE from inside
 * the catch, so the client gets no response at all where a 500 is the honest
 * answer. The `code` is deleted so the status is not repeated in the body; every
 * handler in this file answers through here, so they cannot drift apart.
 */
const sendError = (res: express.Response, err: any) => {
  const code = typeof err?.code === 'number' ? err.code : 500

  if (err && typeof err === 'object') delete err.code

  res.status(code).send(err)
}

runRouter.post('/execute', async (req, res) => {
  const { error, value: body } = runCodeValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.executeCode(req, body)

    if (response instanceof Buffer) {
      res.writeHead(200, (req as any).sasHeaders)
      return res.end(response)
    }

    res.send(response)
  } catch (err: any) {
    sendError(res, err)
  }
})

runRouter.post('/trigger', async (req, res) => {
  const { error, value: body } = triggerCodeValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.triggerCode(req, body)

    res.status(200)
    res.send(response)
  } catch (err: any) {
    sendError(res, err)
  }
})

runRouter.post('/lint', async (req, res) => {
  const { error, value: body } = lintCodeValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.lintCode(body)
    res.send(response)
  } catch (err: any) {
    sendError(res, err)
  }
})

runRouter.get('/lint-config', async (req, res) => {
  try {
    const filePath =
      typeof req.query.filePath === 'string' ? req.query.filePath : undefined

    res.send(await controller.getLintConfig(filePath))
  } catch (err: any) {
    sendError(res, err)
  }
})

runRouter.post('/format', async (req, res) => {
  const { error, value: body } = formatCodeValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.formatCode(body)

    // The response is the formatted code as a JSON string: `send` would
    // serve it as text/html, which is neither the content type the
    // swagger spec declares nor one a JSON client parses.
    res.json(response)
  } catch (err: any) {
    sendError(res, err)
  }
})

export default runRouter
