import express from 'express'
import {
  formatCodeValidation,
  lintCodeValidation,
  runCodeValidation,
  triggerCodeValidation
} from '../../utils'
import { CodeController } from '../../controllers/'
import { sendRefusal } from '../refusal'

const runRouter = express.Router()

const controller = new CodeController()

/**
 * Answers numeric `code` responses directly and delegates other errors to the
 * shared refusal handler.
 *
 * The execute and trigger controllers throw response objects with a numeric
 * `code`, as does DeployRefusal. Authentication failures are answered by the
 * middleware before these handlers. The code is removed from these responses
 * so it is not repeated in the body.
 *
 * For errors without a numeric code, the refusal handler returns a valid
 * HttpError's 4xx status and message. It logs 5xx failures and sends a fixed
 * body, preserving a valid HttpError's 5xx status; other errors become 500.
 */
const sendError = (res: express.Response, err: any) => {
  if (typeof err?.code !== 'number') return sendRefusal(res, err)
  const code = err.code

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
