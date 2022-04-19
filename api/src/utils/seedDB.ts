import Client from '../model/Client'
import User from '../model/User'

const CLIENT = {
  clientId: 'clientID1',
  clientSecret: 'clientSecret'
}
const ADMIN_USER = {
  id: 1,
  displayName: 'Super Admin',
  username: 'secretuser',
  password: '$2a$10$hKvcVEZdhEQZCcxt6npazO6mY4jJkrzWvfQ5stdBZi8VTTwVMCVXO',
  isAdmin: true,
  isActive: true
}

export const seedDB = async () => {
  // Checking if client is already in the database
  const clientExist = await Client.findOne({ clientId: CLIENT.clientId })
  if (!clientExist) {
    const client = new Client(CLIENT)
    await client.save()

    console.log(`DB Seed - client created: ${CLIENT.clientId}`)
  }

  // Checking if user is already in the database
  const usernameExist = await User.findOne({ username: ADMIN_USER.username })
  if (!usernameExist) {
    const user = new User(ADMIN_USER)
    await user.save()

    console.log(`DB Seed - admin account created: ${ADMIN_USER.username}`)
  }
}
