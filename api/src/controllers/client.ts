import { Security, Route, Tags, Example, Post, Body } from 'tsoa'

import Client, {
  ClientPayload,
  NUMBER_OF_SECONDS_IN_A_DAY
} from '../model/Client'

@Security('bearerAuth')
@Route('SASjsApi/client')
@Tags('Client')
export class ClientController {
  /**
   * @summary Admin only task. Create client with the following attributes:
   * ClientId,
   * ClientSecret,
   * accessTokenExpiryDays (optional),
   * refreshTokenExpiryDays (optional)
   *
   */
  @Example<ClientPayload>({
    clientId: 'someFormattedClientID1234',
    clientSecret: 'someRandomCryptoString',
    accessTokenExpiration: NUMBER_OF_SECONDS_IN_A_DAY,
    refreshTokenExpiration: NUMBER_OF_SECONDS_IN_A_DAY * 30
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
    accessTokenExpiration,
    refreshTokenExpiration
  } = data

  // Checking if client is already in the database
  const clientExist = await Client.findOne({ clientId })
  if (clientExist) throw new Error('Client ID already exists.')

  // Create a new client
  const client = new Client({
    clientId,
    clientSecret,
    accessTokenExpiration,
    refreshTokenExpiration
  })

  const savedClient = await client.save()

  return {
    clientId: savedClient.clientId,
    clientSecret: savedClient.clientSecret,
    accessTokenExpiration: savedClient.accessTokenExpiration,
    refreshTokenExpiration: savedClient.refreshTokenExpiration
  }
}
