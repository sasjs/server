import mongoose from 'mongoose'
import { seedDB } from './seedDB'

export const connectDB = async () => {
  // NOTE: when exporting app.js as agent for supertest
  // we should exclude connecting to the real database
  if (process.env.NODE_ENV === 'test') {
    return
  }

  const { MODE } = process.env

  if (MODE?.trim() !== 'server') {
    console.log('Running in Desktop Mode, no DB to connect.')
    return
  }

  try {
    await mongoose.connect(process.env.DB_CONNECT as string)
  } catch (err) {
    throw new Error('Unable to connect to DB!')
  }

  console.log('Connected to DB!')
  await seedDB()

  return mongoose.connection
}
