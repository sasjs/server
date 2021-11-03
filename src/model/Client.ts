import mongoose from 'mongoose'

const clientSchema = new mongoose.Schema({
  clientId: {
    type: String,
    required: true
  },
  clientSecret: {
    type: String,
    required: true
  }
})

export default mongoose.model('Client', clientSchema)
