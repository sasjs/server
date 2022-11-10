import { Security, Route, Tags, Example, Post, Body } from 'tsoa'

import Client, { ClientPayload } from '../model/Client'

@Security('bearerAuth')
@Route('SASjsApi/client')
@Tags('Client')
export class ClientController {
  /**
   * @summary Create client with the following attributes: ClientId, ClientSecret, accessTokenExpires (optional) . Admin only task.
   *
   */
  @Example<ClientPayload>({
    clientId: 'someFormattedClientID1234',
    clientSecret: 'someRandomCryptoString',
    accessTokenExpiryDays: 1,
    refreshTokenExpiryDays: 30
  })
  @Post('/')
  public async createClient(
    @Body() body: ClientPayload
  ): Promise<ClientPayload> {
    return createClient(body)
  }
}

const createClient = async (data: ClientPayload): Promise<ClientPayload> => {
  const {
    clientId,
    clientSecret,
    accessTokenExpiryDays,
    refreshTokenExpiryDays
  } = data

  // Checking if client is already in the database
  const clientExist = await Client.findOne({ clientId })
  if (clientExist) throw new Error('Client ID already exists.')

  // Create a new client
  const client = new Client({
    clientId,
    clientSecret,
    accessTokenExpiryDays
  })

  const savedClient = await client.save()

  return {
    clientId: savedClient.clientId,
    clientSecret: savedClient.clientSecret,
    accessTokenExpiryDays: savedClient.accessTokenExpiryDays,
    refreshTokenExpiryDays: savedClient.refreshTokenExpiryDays
  }
}
