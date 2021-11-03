import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  displayName: {
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
  isAdmin: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tokens: [
    {
      clientId: {
        type: String,
        required: true
      },
      accessToken: {
        type: String,
        required: true
      },
      refreshToken: {
        type: String,
        required: true
      }
    }
  ]
})

export default mongoose.model('User', userSchema)
