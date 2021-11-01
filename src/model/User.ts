import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  displayname: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  isadmin: {
    type: Boolean,
    default: false
  },
  isactive: {
    type: Boolean,
    default: true
  }
})

export default mongoose.model('User', userSchema)
