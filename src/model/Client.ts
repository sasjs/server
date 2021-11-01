import mongoose from 'mongoose'

const clientSchema = new mongoose.Schema({
  clientid: {
    type: String,
    required: true
  },
  clientsecret: {
    type: String,
    required: true
  }
})

export default mongoose.model('Client', clientSchema)
