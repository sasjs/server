import Client from '../model/Client'

export const createClient = async (data: any) => {
  const { clientId, clientSecret } = data

  // Checking if client is already in the database
  const clientExist = await Client.findOne({ clientId })
  if (clientExist) throw new Error('Client ID already exists.')

  // Create a new client
  const client = new Client({
    clientId,
    clientSecret
  })

  const savedClient = await client.save()

  return {
    clientId: savedClient.clientId,
    clientSecret: savedClient.clientSecret
  }
}
