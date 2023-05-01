import mongoose, { Schema } from 'mongoose'

const CounterSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  seq: {
    type: Number,
    required: true
  }
})

export default mongoose.model('Counter', CounterSchema)
