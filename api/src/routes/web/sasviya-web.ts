import express from 'express'
import { generateCSRFToken } from '../../middlewares'
import { WebController } from '../../controllers/web'

const sasViyaWebRouter = express.Router()
const controller = new WebController()

sasViyaWebRouter.get('/', async (req, res) => {
  let response
  try {
    response = await controller.home()
  } catch (_) {
    response = '<html><head></head><body>Web Build is not present</body></html>'
  } finally {
    const codeToInject = `<script>document.cookie = 'XSRF-TOKEN=${generateCSRFToken()}; Max-Age=86400; SameSite=Strict; Path=/;'</script>`
    const injectedContent = response?.replace(
      '</head>',
      `${codeToInject}</head>`
    )

    return res.send(injectedContent)
  }
})

sasViyaWebRouter.post('/SASJobExecution/', async (req, res) => {
  try {
    res.send({ test: 'test' })
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

export default sasViyaWebRouter
