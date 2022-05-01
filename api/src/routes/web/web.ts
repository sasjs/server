import express from 'express'
import { WebController } from '../../controllers/web'
import { loginWebValidation } from '../../utils'

const webRouter = express.Router()
const controller = new WebController()

webRouter.get('/', async (req, res) => {
  try {
    const response = await controller.home(req)
    return res.send(response)
  } catch (_) {
    return res.send('Web Build is not present')
  }
})

webRouter.post('/login', async (req, res) => {
  const { error, value: body } = loginWebValidation(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  try {
    const response = await controller.login(req, body)
    res.send(response)
  } catch (err: any) {
    res.status(400).send(err.toString())
  }
})

webRouter.get('/logout', async (req, res) => {
  try {
    await controller.logout(req)
    res.status(200).send('OK!')
  } catch (err: any) {
    res.status(400).send(err.toString())
  }
})

export default webRouter
