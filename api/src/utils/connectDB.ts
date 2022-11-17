import mongoose from 'mongoose'
import { seedDB } from './seedDB'

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_CONNECT as string)
  } catch (err) {
    throw new Error('Unable to connect to DB!')
  }

  process.logger.success('Connected to DB!')
  return seedDB()
}
