import express from 'express'
import driveRouter from './drive'
import stpRouter from './stp'

const router = express.Router()

router.use('/drive', driveRouter)
router.use('/stp', stpRouter)

export default router
