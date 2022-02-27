import mongoose from 'mongoose'
import { populateClients } from '../routes/api/auth'

export const connectDB = async () => {
  // NOTE: when exporting app.js as agent for supertest
  // we should exclude connecting to the real database
  if (process.env.NODE_ENV === 'test') {
    return
  } else {
    const { MODE } = process.env

    if (MODE?.trim() !== 'server') {
      console.log('Running in Destop Mode, no DB to connect.')
      return
    }

    mongoose.connect(process.env.DB_CONNECT as string, async (err) => {
      if (err) throw err

      console.log('Connected to db!')

      await populateClients()
    })
  }
}
