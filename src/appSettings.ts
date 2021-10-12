export const appSettings = {
  appCredentials: {
    clientId: process.env.CLIENTID as string,
    tenantId: process.env.TENANTID as string,
    clientSecret: process.env.CLIENTSECRET as string
  },
  authRoutes: {
    redirect: '/redirect',
    error: '/error', // the wrapper will redirect to this route in case of any error.
    unauthorized: '/unauthorized' // the wrapper will redirect to this route in case of unauthorized access attempt.
  }
}
