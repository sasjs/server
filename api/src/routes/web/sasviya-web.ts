import express from 'express'
import { setCSRFCookie } from '../../middlewares'
import { WebController } from '../../controllers/web'

const sasViyaWebRouter = express.Router()
const controller = new WebController()

sasViyaWebRouter.get('/', async (req, res) => {
  let response
  try {
    response = await controller.home()
  } catch (_) {
    response = '<html><head></head><body>Web Build is not present</body></html>'
  }

  setCSRFCookie(req, res)

  return res.send(response)
})

sasViyaWebRouter.post('/SASJobExecution/', async (req, res) => {
  try {
    res.send({ test: 'test' })
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

export default sasViyaWebRouter
