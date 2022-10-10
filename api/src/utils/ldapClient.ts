import { createClient, Client } from 'ldapjs'
import { ReturnCode } from './verifyEnvVariables'

export interface LDAPUser {
  uid: string
  username: string
  displayName: string
}

export interface LDAPGroup {
  name: string
  members: string[]
}

export class LDAPClient {
  private ldapClient: Client
  private static classInstance: LDAPClient | null

  private constructor() {
    process.logger.info('creating LDAP client')
    this.ldapClient = createClient({ url: process.env.LDAP_URL as string })

    this.ldapClient.on('error', (error) => {
      process.logger.error(error.message)
    })
  }

  static async init() {
    if (!LDAPClient.classInstance) {
      LDAPClient.classInstance = new LDAPClient()

      process.logger.info('binding LDAP client')
      await LDAPClient.classInstance.bind().catch((error) => {
        LDAPClient.classInstance = null
        throw error
      })
    }
    return LDAPClient.classInstance
  }

  private async bind() {
    const promise = new Promise<void>((resolve, reject) => {
      const { LDAP_BIND_DN, LDAP_BIND_PASSWORD } = process.env
      this.ldapClient.bind(LDAP_BIND_DN!, LDAP_BIND_PASSWORD!, (error) => {
        if (error) reject(error)

        resolve()
      })
    })

    await promise.catch((error) => {
      throw new Error(error.message)
    })
  }

  async getAllLDAPUsers() {
    const promise = new Promise<LDAPUser[]>((resolve, reject) => {
      const { LDAP_USERS_BASE_DN } = process.env
      const filter = `(objectClass=*)`

      this.ldapClient.search(
        LDAP_USERS_BASE_DN!,
        { filter },
        (error, result) => {
          if (error) reject(error)

          const users: LDAPUser[] = []

          result.on('searchEntry', (entry) => {
            users.push({
              uid: entry.object.uid as string,
              username: entry.object.username as string,
              displayName: entry.object.displayname as string
            })
          })

          result.on('end', (result) => {
            resolve(users)
          })
        }
      )
    })

    return await promise
      .then((res) => res)
      .catch((error) => {
        throw new Error(error.message)
      })
  }

  async getAllLDAPGroups() {
    const promise = new Promise<LDAPGroup[]>((resolve, reject) => {
      const { LDAP_GROUPS_BASE_DN } = process.env

      this.ldapClient.search(LDAP_GROUPS_BASE_DN!, {}, (error, result) => {
        if (error) reject(error)

        const groups: LDAPGroup[] = []

        result.on('searchEntry', (entry) => {
          const members =
            typeof entry.object.memberuid === 'string'
              ? [entry.object.memberuid]
              : entry.object.memberuid
          groups.push({
            name: entry.object.cn as string,
            members
          })
        })

        result.on('end', (result) => {
          resolve(groups)
        })
      })
    })

    return await promise
      .then((res) => res)
      .catch((error) => {
        throw new Error(error.message)
      })
  }

  async verifyUser(username: string, password: string) {
    const promise = new Promise<boolean>((resolve, reject) => {
      const { LDAP_USERS_BASE_DN } = process.env
      const filter = `(username=${username})`

      this.ldapClient.search(
        LDAP_USERS_BASE_DN!,
        { filter },
        (error, result) => {
          if (error) reject(error)

          const items: any = []

          result.on('searchEntry', (entry) => {
            items.push(entry.object)
          })

          result.on('end', (result) => {
            if (result?.status !== 0 || items.length === 0) return reject()

            // pick the first found
            const user = items[0]

            this.ldapClient.bind(user.dn, password, (error) => {
              if (error) return reject(error)

              resolve(true)
            })
          })
        }
      )
    })

    return await promise
      .then(() => true)
      .catch(() => {
        throw new Error('Invalid password.')
      })
  }
}
