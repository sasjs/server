import express from 'express'
import filesRouter from './files'
import stpRouter from './stp'

const router = express.Router()

router.use('/files', filesRouter)
router.use('/stp', stpRouter)

export default router
