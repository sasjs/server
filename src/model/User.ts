import { string } from 'joi'
import mongoose, { Schema } from 'mongoose'

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
  },
  tokens: [
    {
      clientid: {
        type: String,
        required: true
      },
      accesstoken: {
        type: String,
        required: true
      },
      refreshtoken: {
        type: String,
        required: true
      }
    }
  ]
})

export default mongoose.model('User', userSchema)
