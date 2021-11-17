import path from 'path'
import mongoose from 'mongoose'
import { configuration } from '../../package.json'
import { getDesktopFields } from '.'
import { populateClients } from '../routes/api/auth'
import shelljs from 'shelljs'

export const connectDB = async () => {
  shelljs.exec(`sasjs v`)

  const { MODE } = process.env
  if (MODE?.trim() !== 'server') {
    console.log('Running in Destop Mode, no DB to connect.')

    const { sasLoc, driveLoc } = await getDesktopFields()

    process.sasLoc = sasLoc
    process.driveLoc = driveLoc

    return
  } else {
    const { SAS_PATH } = process.env
    const sasDir = SAS_PATH ?? configuration.sasPath

    process.sasLoc = path.join(sasDir, 'sas')
  }

  console.log('sasLoc: ', process.sasLoc)

  // NOTE: when exporting app.js as agent for supertest
  // we should exlcude connecting to the real database
  if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(process.env.DB_CONNECT as string, async (err) => {
      if (err) throw err

      console.log('Connected to db!')

      await populateClients()
    })
  }
}
