import { Security, Route, Tags, Example, Post, Body, Get } from 'tsoa'

import Client, {
  ClientPayload,
  NUMBER_OF_SECONDS_IN_A_DAY
} from '../model/Client'

@Security('bearerAuth')
@Route('SASjsApi/client')
@Tags('Client')
export class ClientController {
  /**
   * Registers a new OAuth client that SASjs applications can authenticate with.
   *
   * A client is identified by `clientId` and `clientSecret`. The two optional
   * fields set token lifetimes in seconds; when omitted, the defaults of 86400
   * (one day) for the access token and 2592000 (30 days) for the refresh token
   * apply. Admin only.
   *
   * @summary Create a client
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

  /**
   * Returns every registered client with its id, secret and token lifetimes.
   * Admin only.
   *
   * @summary List all clients
   */
  @Example<ClientPayload[]>([
    {
      clientId: 'someClientID1234',
      clientSecret: 'someRandomCryptoString',
      accessTokenExpiration: NUMBER_OF_SECONDS_IN_A_DAY,
      refreshTokenExpiration: NUMBER_OF_SECONDS_IN_A_DAY * 30
    },
    {
      clientId: 'someOtherClientID',
      clientSecret: 'someOtherRandomCryptoString',
      accessTokenExpiration: NUMBER_OF_SECONDS_IN_A_DAY,
      refreshTokenExpiration: NUMBER_OF_SECONDS_IN_A_DAY * 30
    }
  ])
  @Get('/')
  public async getAllClients(): Promise<ClientPayload[]> {
    return getAllClients()
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

const getAllClients = async (): Promise<ClientPayload[]> => {
  return Client.find({}).select({
    _id: 0,
    clientId: 1,
    clientSecret: 1,
    accessTokenExpiration: 1,
    refreshTokenExpiration: 1
  })
}
