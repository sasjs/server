import path from 'path'
import mongoose from 'mongoose'
import { configuration } from '../../package.json'
import { getDesktopFields } from '.'
import { populateClients } from '../routes/api/auth'
import { getRealPath } from '@sasjs/utils'

export const connectDB = async () => {
  // NOTE: when exporting app.js as agent for supertest
  // we should exclude connecting to the real database
  if (process.env.NODE_ENV === 'test') {
    process.driveLoc = path.join(process.cwd(), 'tmp')
    return
  } else {
    const { MODE } = process.env

    if (MODE?.trim() !== 'server') {
      console.log('Running in Destop Mode, no DB to connect.')

      const { sasLoc, driveLoc } = await getDesktopFields()

      process.sasLoc = sasLoc
      process.driveLoc = driveLoc
    } else {
      const { SAS_PATH, DRIVE_PATH } = process.env

      process.sasLoc = SAS_PATH ?? configuration.sasPath
      process.driveLoc = getRealPath(
        path.join(process.cwd(), DRIVE_PATH ?? 'tmp')
      )
    }

    console.log('sasLoc: ', process.sasLoc)
    console.log('sasDrive: ', process.driveLoc)

    if (MODE?.trim() !== 'server') return

    mongoose.connect(process.env.DB_CONNECT as string, async (err) => {
      if (err) throw err

      console.log('Connected to db!')

      await populateClients()
    })
  }
}
