import { Express } from 'express'
import { checkDomain } from '../middlewares'
import { getWhiteListed } from './configureCors'

export const configureDomains = (app: Express) => {
  // const domains: string[] = []
  const domains = new Set<string>()
  const { ALLOWED_DOMAINS } = process.env

  const allowedDomains = ALLOWED_DOMAINS?.trim().split(' ') ?? []

  const whiteListed = getWhiteListed()

  const combinedUrls = [...allowedDomains, ...whiteListed]
  combinedUrls
    .filter((domainName) => !!domainName)
    .forEach((url) => {
      try {
        const domain = new URL(url)
        domains.add(domain.hostname)
      } catch (_) {}
    })

  if (domains.size) {
    process.allowedDomains = [...domains]
    console.log('Allowed Domain(s):', process.allowedDomains)
    app.use(checkDomain)
  }
}
