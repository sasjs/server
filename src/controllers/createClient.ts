import Client from '../model/Client'

export const createClient = async (data: any) => {
  const { clientid, clientsecret } = data

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
    clientid: savedClient.clientid,
    clientsecret: savedClient.clientsecret
  }
}
