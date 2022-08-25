import express from 'express'

const mockViyaRouter = express.Router()

mockViyaRouter.post('/SASJobExecution/', async (req, res) => {
  try {
    res.send({ test: 'test' })
  } catch (err: any) {
    res.status(403).send(err.toString())
  }
})

export default mockViyaRouter
