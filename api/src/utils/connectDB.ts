import path from 'path'
import mongoose from 'mongoose'
import { configuration } from '../../package.json'
import { getDesktopFields } from '.'
import { populateClients } from '../routes/api/auth'
import { fileExists } from '@sasjs/utils'

export const connectDB = async () => {
  const { MODE } = process.env
  if (MODE?.trim() !== 'server') {
    console.log('Running in Destop Mode, no DB to connect.')

    const { sasLoc, driveLoc } = await getDesktopFields()

    process.sasLoc = sasLoc
    process.driveLoc = driveLoc

    return
  } else {
    const { SAS_EXEC } = process.env
    process.sasLoc = SAS_EXEC
      ? path.join(__dirname, '..', '..', '..', SAS_EXEC)
      : configuration.sasPath
  }

  console.log('SAS_EXEC: ', process.sasLoc)
  console.log('SAS_EXEC Exists: ', await fileExists(process.sasLoc))

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
