import Client from '../model/Client'

export const createClient = async (data: any) => {
  const { client_id: clientid, client_secret: clientsecret } = data

  // Checking if client is already in the database
  const clientExist = await Client.findOne({ clientid })
  if (clientExist) throw new Error('Client ID already exists.')

  // Create a new client
  const client = new Client({
    clientid,
    clientsecret
  })

  const savedClient = await client.save()

  return {
    client_id: savedClient.clientid,
    client_secret: savedClient.clientsecret
  }
}
