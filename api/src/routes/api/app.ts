import express from 'express'

import { AppController } from '../../controllers'
import { HttpError } from '../../utils'

const router = express.Router()

/**
 * What is published under one App Stream id.
 *
 * The answer is the controller's, and the contract is the controller's too: this
 * route states no shape of its own, so the document generated from the controller's
 * decorators describes exactly what a caller gets. The failure shape is this route's
 * business, because it is the express answer rather than the controller's return.
 */
router.get('/:id', async (req, res) => {
  try {
    res.json(await new AppController().getApp(req, req.params.id))
  } catch (err: any) {
    // a 4xx message is the contract - the corpus pins these - and it is the
    // controller's own refusal
    if (err instanceof HttpError)
      return res
        .status(err.status)
        .json({ status: 'failure', message: err.message })

    // a 5xx body is not: a driver or library message can carry internals and gives
    // the caller nothing to act on, so it gets a fixed message - in the same envelope
    // as every other refusal here, so a client parses one shape - and the detail is
    // logged
    process.logger?.error?.(err)

    res
      .status(500)
      .json({ status: 'failure', message: 'Internal Server Error' })
  }
})

export default router
