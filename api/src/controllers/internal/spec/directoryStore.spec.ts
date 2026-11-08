import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

import User from '../../../model/User'
import Group from '../../../model/Group'
import { AuthProviderType } from '../../../utils'
import { mongoDirectoryStore } from '../directoryStore'

/**
 * The store is the part of the LDAP import this host wrote itself - the import
 * rule lives in `@sasjs/api` and is tested there. So these cases are about the
 * mapping: a directory uid is not a Mongo ObjectId, a group carries ObjectIds
 * while the API keys membership by username, and an account created by an
 * import must not be signable-into locally.
 */

let mongod: MongoMemoryServer

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
}, 60000)

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

afterEach(async () => {
  await User.deleteMany({})
  await Group.deleteMany({})
})

const hex = /^[a-f0-9]{24}$/

describe('mongoDirectoryStore', () => {
  it('creates a directory account that cannot be signed into locally', async () => {
    const store = mongoDirectoryStore()

    const created = await store.createUser({
      username: 'ada',
      displayName: 'Ada Lovelace',
      isAdmin: false,
      isActive: true,
      authProvider: AuthProviderType.LDAP
    })

    expect(created.username).toEqual('ada')
    expect(created.authProvider).toEqual(AuthProviderType.LDAP)
    expect(created.needsToUpdatePassword).toBe(false)
    expect(created.uid).toMatch(hex)
    expect(created).not.toHaveProperty('password')

    const stored = await User.findOne({ username: 'ada' })

    expect(stored).not.toBeNull()
    // a hash, not the random string, and nothing a caller could have guessed
    expect(stored!.password).not.toEqual('')
    expect(stored!.comparePassword('')).toBe(false)
    expect(stored!.comparePassword('password')).toBe(false)
  })

  it('lists users with their group identifiers as strings', async () => {
    const store = mongoDirectoryStore()

    const user = await store.createUser({
      username: 'grace',
      displayName: 'Grace Hopper',
      isAdmin: true,
      isActive: true
    })
    const group = await store.createGroup({
      name: 'group-a',
      description: 'first',
      isActive: true,
      authProvider: AuthProviderType.LDAP
    })

    await store.addToGroup(group.uid, user.uid)

    const users = await store.users()
    const listed = users.find((candidate) => candidate.username === 'grace')!

    // the API keys membership by identifier, so the store must not hand back
    // populated documents - which is what a `save` hook leaves on the model
    expect(listed.groups).toEqual([group.uid])
    expect(Array.isArray(listed.groups)).toBe(true)
  })

  it('creates a group with the provider and no members', async () => {
    const store = mongoDirectoryStore()

    const created = await store.createGroup({
      name: 'group-b',
      description: 'second',
      isActive: true,
      authProvider: AuthProviderType.LDAP
    })

    expect(created.uid).toMatch(hex)
    expect(created.users).toEqual([])
    expect(created.authProvider).toEqual(AuthProviderType.LDAP)

    const listed = await store.groups()
    expect(listed.map((group) => group.name)).toEqual(['group-b'])
  })

  it('applies membership to both sides, and keeps it to one entry', async () => {
    const store = mongoDirectoryStore()

    const user = await store.createUser({
      username: 'alan',
      displayName: 'Alan Turing',
      isAdmin: false,
      isActive: true
    })
    const group = await store.createGroup({
      name: 'group-c',
      description: 'third',
      isActive: true
    })

    const first = await store.addToGroup(group.uid, user.uid)
    const second = await store.addToGroup(group.uid, user.uid)

    expect(first!.users).toEqual([user.uid])
    expect(second!.users).toEqual([user.uid])

    const storedUser = await User.findOne({ username: 'alan' })
    expect(storedUser!.groups.map(String)).toEqual([group.uid])
  })

  it('answers undefined for an unknown group or an unknown user', async () => {
    const store = mongoDirectoryStore()

    const user = await store.createUser({
      username: 'edsger',
      displayName: 'Edsger Dijkstra',
      isAdmin: false,
      isActive: true
    })
    const group = await store.createGroup({
      name: 'group-d',
      description: 'fourth',
      isActive: true
    })

    const missingGroup = new mongoose.Types.ObjectId().toString()
    const missingUser = new mongoose.Types.ObjectId().toString()

    expect(await store.addToGroup(missingGroup, user.uid)).toBeUndefined()
    expect(await store.addToGroup(group.uid, missingUser)).toBeUndefined()
  })
})
