import express from 'express'
import { WebController } from '../../controllers/web'
import { authenticateAccessToken } from '../../middlewares'
import { authorizeValidation, loginWebValidation } from '../../utils'

const webRouter = express.Router()
const controller = new WebController()

webRouter.get('/', async (req, res) => {
  try {
    const response = await controller.home()

    res.cookie('XSRF-TOKEN', req.csrfToken())

    return res.send(response)
  } catch (_) {
    return res.send('Web Build is not present')
  }
})

webRouter.post('/SASLogon/login', async (req, res) => {
  const { error, value: body } = loginWebValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.login(req, body)
    res.send(response)
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

webRouter.post(
  '/SASLogon/authorize',
  authenticateAccessToken,
  async (req, res) => {
    const { error, value: body } = authorizeValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    try {
      const response = await controller.authorize(req, body)
      res.send(response)
    } catch (err: any) {
      res.status(403).send(err.toString())
    }
  }
)

webRouter.get('/logout', async (req, res) => {
  try {
    await controller.logout(req)
    res.status(200).send('OK!')
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

export default webRouter
